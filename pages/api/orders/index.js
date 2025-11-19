import { prisma } from '@/lib/prisma';
import { sendTelegramNotification, formatOrderNotification, formatLowStockNotification } from '@/services/telegram';
import { CreateOrderSchema } from '@/lib/validation';
import { getAdminFromReq } from '@/lib/auth';

export default async function handler(req, res) {

  const admin = getAdminFromReq(req);
  if (!admin) return res.status(401).json({ error: 'Unauthorized' });

  const { tenantId } = admin;

  if (req.method === 'GET') {
    try {
      const { page = 1, limit = 50 } = req.query;
      const skip = (page - 1) * limit;

      const where = { tenantId };

      const orders = await prisma.order.findMany({
        where,
        include: {
          customer: true,
          items: { include: { product: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(limit)
      });

      const total = await prisma.order.count({ where });

      return res.json({
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        }
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch orders" });
    }
  }

  if (req.method === 'POST') {
    try {
      const validated = CreateOrderSchema.parse(req.body);
      const { customer, items, source } = validated;

      const lowThreshold = process.env.LOW_STOCK_THRESHOLD || 5;

      const result = await prisma.$transaction(async (tx) => {

        const customerRecord = await tx.customer.upsert({
          where: { phone: customer.phone },
          update: { name: customer.name, notes: customer.message, tenantId },
          create: {
            name: customer.name,
            phone: customer.phone,
            notes: customer.message,
            type: source === 'POS' ? 'PERMANENT' : 'TEMPORARY',
            tenantId,
          },
        });

        for (const item of items) {
          const product = await tx.product.findFirst({
            where: { id: item.productId, tenantId }
          });

          if (!product) throw new Error(`Product not found`);
          if (product.stock < item.quantity)
            throw new Error(`Insufficient stock for ${product.title}`);
        }

        const order = await tx.order.create({
          data: {
            source,
            customerId: customerRecord.id,
            tenantId,
            total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
            items: {
              create: items.map(i => ({
                productId: i.productId,
                quantity: i.quantity,
                price: i.price
              }))
            }
          },
          include: { items: { include: { product: true } } }
        });

        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });

          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              tenantId,
              reason: 'sale',
              change: -item.quantity,
              ref: `order:${order.id}`
            }
          });
        }

        const fullOrder = await tx.order.findUnique({
          where: { id: order.id },
          include: {
            customer: true,
            items: { include: { product: true } }
          }
        });

        return { fullOrder, customerRecord };
      });

      const { fullOrder, customerRecord } = result;

      try {
        await sendTelegramNotification(
          formatOrderNotification(fullOrder, customerRecord, fullOrder.items, source)
        );
      } catch (e) {}

      for (const item of fullOrder.items) {
        if (item.product.stock <= lowThreshold) {
          try {
            await sendTelegramNotification(
              formatLowStockNotification(item.product)
            );
          } catch (e) {}
        }
      }

      return res.status(201).json(fullOrder);

    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: error.message });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
