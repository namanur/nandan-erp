// pages/api/orders/[id].js

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { UpdateOrderStatusSchema } from '@/lib/validation';

async function handler(req, res) {
  const { id } = req.query;
  const orderId = parseInt(id);

  if (isNaN(orderId)) {
    return res.status(400).json({ error: 'Invalid order ID' });
  }

  // --- GET a single order ---
  if (req.method === 'GET') {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      return res.json(order);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      return res.status(500).json({ error: 'Failed to fetch order' });
    }
  }

  // --- UPDATE an order (e.g., change status) ---
  if (req.method === 'PUT') {
    try {
      const validatedData = UpdateOrderStatusSchema.parse(req.body);
      const { status } = validatedData;

      const currentOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!currentOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // If status is already what's requested, do nothing
      if (currentOrder.status === status) {
        // Return the full order, just like GET
        return res.json(currentOrder);
      }
      
      let updatedOrder; // To store the result

      // --- CRITICAL LOGIC: Handle Cancellation and Restocking ---
      if (status === 'CANCELLED' && currentOrder.status !== 'CANCELLED') {
        
        updatedOrder = await prisma.$transaction(async (tx) => {
          // 1. Add stock back to products
          for (const item of currentOrder.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }

          // 2. Update the order status
          const order = await tx.order.update({
            where: { id: orderId },
            data: { status: 'CANCELLED' },
          });
          return order;
        });

      } else {
        // --- Standard status update (e.g., PENDING -> CONFIRMED) ---
        updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: { status },
        });
      }

      // --- 💡 YOUR FIX APPLIED HERE ---
      // Refetch the order with all relations to send consistent data
      const completeOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          items: { include: { product: true } }
        }
      });
      
      return res.json(completeOrder); // Return complete, consistent data

    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      }
      console.error('Failed to update order:', error);
      return res.status(500).json({ error: 'Failed to update order' });
    }
  }
  
  // --- DELETE an order (Use with caution!) ---
  if (req.method === 'DELETE') {
    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Only allow deleting PENDING or CANCELLED orders to be safe
      if (order.status !== 'PENDING' && order.status !== 'CANCELLED') {
        return res.status(409).json({ 
          error: 'Cannot delete an active order. Please cancel it first.' 
        });
      }

      // We must delete the related OrderItems first
      await prisma.orderItem.deleteMany({
        where: { orderId: orderId },
      });
      
      // Then we can delete the Order
      await prisma.order.delete({
        where: { id: orderId },
      });

      return res.status(204).end(); // 204 = No Content

    } catch (error) {
      console.error('Failed to delete order:', error);
      return res.status(500).json({ error: 'Failed to delete order' });
    }
  }

  // --- Method not allowed ---
  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

// Wrap the handler with admin-only authentication
export default requireAdmin(handler);