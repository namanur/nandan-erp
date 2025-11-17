// pages/api/inventory/adjust.js

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { AdjustStockSchema } from '@/lib/validation';

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const validatedData = AdjustStockSchema.parse(req.body);
    const { productId, change, reason } = validatedData;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if stock would go negative if not allowed
    const newStock = product.stock + change;
    if (newStock < 0) {
      return res.status(409).json({
        error: `Cannot adjust stock. Current stock is ${product.stock}. Change of ${change} would result in negative stock.`,
      });
    }

    // Update the product stock
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        stock: {
          // 'increment' can be positive or negative
          increment: change,
        },
      },
    });

    // --- FUTURE V2 IMPROVEMENT ---
    // Here, you would ideally create a log entry:
    // await prisma.inventoryLog.create({
    //   data: {
    //     productId: productId,
    //     change: change,
    //     reason: reason || 'Manual adjustment',
    //     oldStock: product.stock,
    //     newStock: updatedProduct.stock,
    //     // adminUserId: req.admin.id // If you store admin ID in JWT
    //   }
    // });
    console.log(`Stock adjusted for product ${productId}: ${product.stock} -> ${updatedProduct.stock}. Reason: ${reason || 'N/A'}`);
    
    return res.json(updatedProduct);

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    console.error('Failed to adjust stock:', error);
    return res.status(500).json({ error: 'Failed to adjust stock' });
  }
}

// Wrap the handler with admin-only authentication
export default requireAdmin(handler);