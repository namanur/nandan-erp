import { prisma } from '@/lib/prisma';
import { sendTelegramNotification, formatOrderNotification, formatLowStockNotification } from '@/services/telegram';
import { CreateOrderSchema } from '@/lib/validation';
import { getAdminFromReq } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Only admin can view orders
    const admin = getAdminFromReq(req);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { page = 1, limit = 50 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const orders = await prisma.order.findMany({
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      });

      const total = await prisma.order.count();

      res.json({
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  } else if (req.method === 'POST') {
    try {
      // Validate input
      const validatedData = CreateOrderSchema.parse(req.body);
      const { customer, items, source } = validatedData;

      const lowStockThreshold = parseInt(process.env.LOW_STOCK_THRESHOLD) || 5;

      // Use transaction for atomic operations
      const result = await prisma.$transaction(async (tx) => {
        // Create or find customer with notes
        const customerRecord = await tx.customer.upsert({
          where: { phone: customer.phone },
          update: { 
            name: customer.name,
            notes: customer.message || undefined,
          },
          create: {
            name: customer.name,
            phone: customer.phone,
            type: source === 'POS' ? 'PERMANENT' : 'TEMPORARY',
            notes: customer.message || undefined,
          },
        });

        // Check stock availability and create order
        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${product.title}. Available: ${product.stock}, Requested: ${item.quantity}`);
          }
        }

        // Create order
        const order = await tx.order.create({
          data: {
            source,
            customerId: customerRecord.id,
            items: {
              create: items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        // Update stock
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        // Refetch order with updated product info
        const fullOrder = await tx.order.findUnique({
          where: { id: order.id },
          include: {
            customer: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        return { order: fullOrder, customer: customerRecord };
      });

      const { order, customer: customerRecord } = result;

      // Send Telegram notification (outside transaction)
      try {
        const notification = formatOrderNotification(order, customerRecord, order.items, source);
        await sendTelegramNotification(notification);
      } catch (telegramError) {
        console.error('Failed to send Telegram notification:', telegramError);
        // Don't fail the order if notification fails
      }

      // Check for low stock alerts
      for (const item of order.items) {
        if (item.product.stock <= lowStockThreshold) {
          try {
            const lowStockNotification = formatLowStockNotification(item.product);
            await sendTelegramNotification(lowStockNotification);
          } catch (alertError) {
            console.error('Failed to send low stock alert:', alertError);
          }
        }
      }

      res.status(201).json(order);
    } catch (error) {
      console.error('Order creation error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      }

      if (error.message.includes('Insufficient stock') || error.message.includes('Product not found')) {
        return res.status(409).json({ error: error.message });
      }

      res.status(500).json({ 
        error: 'Failed to create order',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}