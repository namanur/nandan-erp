import { prisma } from '@/lib/prisma';
import { ProductSchema } from '@/lib/validation';
import { getAdminFromReq } from '@/lib/auth';

export default async function handler(req, res) {
  // --- MULTI-TENANCY UPGRADE ---
  // Get the authenticated admin user AND their tenantId from the request.
  // We do this at the top so ALL methods (GET, POST) are secure.
  const admin = await getAdminFromReq(req);
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // All database queries will now be filtered by this tenantId.
  const { tenantId } = admin;
  // --- END UPGRADE ---

  if (req.method === 'GET') {
    try {
      const { search, category, page = 1, limit = 100 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // --- MULTI-TENANCY UPGRADE ---
      // The 'where' clause now MUST include the tenantId.
      let where = {
        tenantId: tenantId, // <--- THIS IS THE KEY
      };
      // --- END UPGRADE ---
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      if (category && category !== 'all') {
        where.category = category;
      }

      // Both database calls are now correctly filtered by tenantId via the 'where' object
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy: { title: 'asc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.product.count({ where }),
      ]);

      res.json({
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Failed to fetch products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  } else if (req.method === 'POST') {
    // No need to check for admin again, we did it at the top.
    
    try {
      const validatedData = ProductSchema.parse(req.body);

      // --- MULTI-TENANCY UPGRADE ---
      // When creating a new product, spread the validated data
      // AND add the tenantId to connect it to the correct tenant.
      const product = await prisma.product.create({
        data: {
          ...validatedData,
          tenantId: tenantId, // <--- THIS IS THE KEY
        },
      });
      // --- END UPGRADE ---
      
      res.status(201).json(product);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      }
      console.error('Failed to create product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }

  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 