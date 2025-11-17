import { prisma } from '@/lib/prisma';
import { ProductSchema } from '@/lib/validation';
import { getAdminFromReq } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { search, category, page = 1, limit = 100 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      let where = {};
      
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
    // Check admin authentication
    const admin = getAdminFromReq(req);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // --- THIS BLOCK IS NOW FIXED ---
    try {
      const validatedData = ProductSchema.parse(req.body);
      const product = await prisma.product.create({
        data: validatedData,
      });
      res.status(201).json(product);
    } catch (error) { // Added opening brace {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      }
      console.error('Failed to create product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    } // Added closing brace }
    // --- END OF FIX ---

  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}