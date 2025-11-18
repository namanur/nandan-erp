// pages/api/customers/index.js
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

async function handler(req, res) {
  // --- MULTI-TENANCY UPGRADE ---
  // The 'requireAdmin' wrapper gives us the admin object
  const admin = req.admin; 
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { tenantId } = admin;
  // --- END UPGRADE ---

  if (req.method === 'GET') {
    try {
      const { search, page = 1, limit = 50 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // --- MULTI-TENANCY UPGRADE ---
      let where = {
        tenantId: tenantId, // <-- CRITICAL: Filter by tenant
      };
      // --- END UPGRADE ---
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where, // 'where' object now correctly includes tenantId
          orderBy: { name: 'asc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.customer.count({ where }), // 'where' object now correctly includes tenantId
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

export default requireAdmin(handler);