// pages/api/customers/[id].js

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { CustomerSchema } from '@/lib/validation';

async function handler(req, res) {
  const { id } = req.query;
  const customerId = parseInt(id);

  if (isNaN(customerId)) {
    return res.status(400).json({ error: 'Invalid customer ID' });
  }

  // --- GET a single customer and their orders ---
  if (req.method === 'GET') {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          orders: { // Include the customer's order history
            orderBy: { createdAt: 'desc' },
            take: 20, // Limit to the 20 most recent orders
            include: {
              items: {
                include: {
                  product: true
                }
              }
            }
          },
        },
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      return res.json(customer);
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      return res.status(500).json({ error: 'Failed to fetch customer' });
    }
  }

  // --- UPDATE a customer's details ---
  if (req.method === 'PUT') {
    try {
      // Validate the incoming data
      const validatedData = CustomerSchema.parse(req.body);
      
      const updatedCustomer = await prisma.customer.update({
        where: { id: customerId },
        data: validatedData,
      });

      return res.json(updatedCustomer);

    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      }
      // Handle unique constraint error (e.g., duplicate phone number)
      if (error.code === 'P2002' && error.meta?.target?.includes('phone')) {
        return res.status(409).json({ error: 'A customer with this phone number already exists.' });
      }
      console.error('Failed to update customer:', error);
      return res.status(500).json({ error: 'Failed to update customer' });
    }
  }

  // --- Method not allowed ---
  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

// Wrap the handler with admin-only authentication
export default requireAdmin(handler);