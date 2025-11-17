// pages/api/dashboard/stats.js

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lowStockThreshold = parseInt(process.env.LOW_STOCK_THRESHOLD) || 10;

    // Run all queries in parallel for efficiency
    const [
      totalOrderCount,
      totalCustomerCount,
      totalRevenueItems,
      monthlyOrderCount,
      monthlyRevenueItems,
      lowStockProducts,
      recentOrders,
    ] = await prisma.$transaction([
      // 1. Total number of orders
      prisma.order.count(),
      
      // 2. Total number of customers
      prisma.customer.count(),
      
      // 3. All items for calculating total revenue
      prisma.orderItem.findMany({
        select: { price: true, quantity: true },
      }),
      
      // 4. Order count this month
      prisma.order.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      
      // 5. Items for calculating monthly revenue
      prisma.orderItem.findMany({
        where: { order: { createdAt: { gte: startOfMonth } } },
        select: { price: true, quantity: true },
      }),
      
      // 6. Products with low stock
      prisma.product.findMany({
        where: { stock: { lte: lowStockThreshold } },
        orderBy: { stock: 'asc' },
      }),
      
      // 7. 5 most recent orders
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
        },
      }),
    ]);

    // Calculate revenue in JavaScript
    // Note: For massive scale, this might be done in the database
    const totalRevenue = totalRevenueItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    
    const monthlyRevenue = monthlyRevenueItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    // Send the compiled stats
    res.json({
      totalRevenue,
      totalOrderCount,
      totalCustomerCount,
      monthlyRevenue,
      monthlyOrderCount,
      lowStockProducts,
      recentOrders,
    });

  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}

// Wrap the handler with admin-only authentication
export default requireAdmin(handler);