import { prisma } from '@/lib/prisma';
import { ProductSchema } from '@/lib/validation';
import { getAdminFromReq } from '@/lib/auth';

export default async function handler(req, res) {
  const { id } = req.query;

  // Validate product ID
  const productId = parseInt(id);
  if (isNaN(productId) || productId <= 0) {
    return res.status(400).json({ 
      error: 'Invalid product ID',
      details: 'Product ID must be a positive number'
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res, productId);
        break;

      case 'PUT':
        await handlePut(req, res, productId);
        break;

      case 'DELETE':
        await handleDelete(req, res, productId);
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ 
          error: 'Method not allowed',
          allowed: ['GET', 'PUT', 'DELETE']
        });
    }
  } catch (error) {
    console.error(`Product API error (${req.method}):`, error);
    return res.status(500).json({ 
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
}

// GET - Get product by ID (public)
async function handleGet(req, res, productId) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        category: true,
        price: true,
        stock: true,
        sku: true,
        hsn: true,
        taxRate: true,
        description: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        productId 
      });
    }

    return res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Failed to fetch product:', error);
    throw error;
  }
}

// PUT - Update product (admin only)
async function handlePut(req, res, productId) {
  // Check admin authentication
  const admin = getAdminFromReq(req);
  if (!admin) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Admin authentication required'
    });
  }

  try {
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return res.status(404).json({ 
        error: 'Product not found',
        productId 
      });
    }

    // Validate request body
    const validatedData = ProductSchema.parse(req.body);

    // Check for SKU uniqueness if SKU is being updated
    if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: validatedData.sku }
      });

      if (existingSku) {
        return res.status(409).json({
          error: 'SKU already exists',
          message: 'Another product with this SKU already exists'
        });
      }
    }

    // Update product
    const product = await prisma.product.update({
      where: { id: productId },
      data: validatedData,
    });

    return res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    console.error('Failed to update product:', error);
    throw error;
  }
}

// DELETE - Delete product (admin only)
async function handleDelete(req, res, productId) {
  // Check admin authentication
  const admin = getAdminFromReq(req);
  if (!admin) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Admin authentication required'
    });
  }

  try {
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return res.status(404).json({ 
        error: 'Product not found',
        productId 
      });
    }

    // Check if product is used in any orders
    const orderItems = await prisma.orderItem.count({
      where: { productId }
    });

    if (orderItems > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete product',
        message: 'Product has existing orders and cannot be deleted',
        orderCount: orderItems,
        suggestion: 'Consider archiving the product instead of deleting'
      });
    }

    // Delete product
    await prisma.product.delete({
      where: { id: productId },
    });

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      deletedProduct: {
        id: productId,
        title: existingProduct.title
      }
    });
  } catch (error) {
    console.error('Failed to delete product:', error);
    
    // Handle foreign key constraint errors
    if (error.code === 'P2003') {
      return res.status(409).json({
        error: 'Cannot delete product',
        message: 'Product is referenced in other records'
      });
    }

    throw error;
  }
}