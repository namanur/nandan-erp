// pages/api/customers/index.js

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { search, page = 1, limit = 50 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      let where = {};
      
      // Add search functionality for name or phone
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Fetch customers and total count in parallel
      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          orderBy: { name: 'asc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.customer.count({ where }),
      ]);

      res.json({
        customers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Wrap the handler with admin-only authentication
export default requireAdmin(handler);