import { prisma } from '@/lib/prisma';
import { sendTelegramNotification, formatOrderNotification, formatLowStockNotification } from '@/services/telegram';
import { CreateOrderSchema } from '@/lib/validation';
import { getAdminFromReq } from '@/lib/auth'; // Using this for both GET and POST

export default async function handler(req, res) {
  // --- MULTI-TENANCY UPGRADE ---
  // We need the tenantId for ALL operations
  const admin = getAdminFromReq(req);
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { tenantId } = admin;
  // --- END UPGRADE ---

  if (req.method === 'GET') {
    try {
      const { page = 1, limit = 50 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // --- MULTI-TENANCY UPGRADE ---
      const where = {
        tenantId: tenantId, // <-- CRITICAL: Filter orders by tenant
      };
      // --- END UPGRADE ---

      const orders = await prisma.order.findMany({
        where, // <-- ADDED
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

      const total = await prisma.order.count({ where }); // <-- ADDED

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
      const validatedData = CreateOrderSchema.parse(req.body);
      const { customer, items, source } = validatedData;

      const lowStockThreshold = parseInt(process.env.LOW_STOCK_THRESHOLD) || 5;

      const result = await prisma.$transaction(async (tx) => {
        // --- MULTI-TENANCY UPGRADE ---
        const customerRecord = await tx.customer.upsert({
          where: { phone: customer.phone }, // This assumes phone is unique ACROSS tenants. Be careful.
          update: { 
            name: customer.name,
            notes: customer.message || undefined,
          },
          create: {
            name: customer.name,
            phone: customer.phone,
            type: source === 'POS' ? 'PERMANENT' : 'TEMPORARY',
            notes: customer.message || undefined,
            tenantId: tenantId, // <-- CRITICAL: Assign customer to tenant
          },
        });
        // --- END UPGRADE ---

        // Verify customer belongs to this tenant (in case they already existed)
        if (customerRecord.tenantId !== tenantId) {
          throw new Error('Customer phone number is associated with another tenant.');
        }

        for (const item of items) {
          // --- MULTI-TENANCY UPGRADE ---
          const product = await tx.product.findFirst({ // Use findFirst with tenantId
            where: { 
              id: item.productId,
              tenantId: tenantId, // <-- CRITICAL: Ensure product belongs to this tenant
            },
          });
          // --- END UPGRADE ---

          if (!product) {
            throw new Error(`Product ${item.productId} not found for this tenant`);
          }
          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${product.title}. Available: ${product.stock}, Requested: ${item.quantity}`);
          }
        }

        // --- MULTI-TENANCY UPGRADE ---
        const order = await tx.order.create({
          data: {
            source,
            customerId: customerRecord.id,
            tenantId: tenantId, // <-- CRITICAL: Assign order to tenant
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
        // --- END UPGRADE ---

        // (Stock update is fine, we already verified the product)
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

      // (Notification logic is fine)
      try {
        const notification = formatOrderNotification(order, customerRecord, order.items, source);
        await sendTelegramNotification(notification);
      } catch (telegramError) {
        console.error('Failed to send Telegram notification:', telegramError);
      }

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
      if (error.message.includes('Insufficient stock') || error.message.includes('Product not found') || error.message.includes('another tenant')) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ 
        error: 'Failed to create order',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(4LET'S GO).end(`Method ${req.method} Not Allowed`);
  }
}