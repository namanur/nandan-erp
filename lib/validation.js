import { z } from 'zod';

export const OrderItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

// Assuming your CreateOrderSchema uses fields from your schema.prisma
export const CreateOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(1, 'Name is required').optional(),
    phone: z.string().min(1, 'Phone is required'),
    message: z.string().optional(),
  }),
  items: z.array(OrderItemSchema).min(1, 'At least one item is required'),
  source: z.enum(['PUBLIC', 'POS']).default('PUBLIC'),
});

export const ProductSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  sku: z.string().optional(),
  hsn: z.string().optional(),
  taxRate: z.number().min(0).max(100).default(0),
  description: z.string().optional(),
  image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export const CustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  type: z.enum(['PERMANENT', 'TEMPORARY']).default('TEMPORARY'),
  notes: z.string().optional(),
});

// --- FIX APPLIED HERE ---
export const AdjustStockSchema = z.object({
  productId: z.number().int().positive(),
  // FIX: Use .refine() instead of the unsupported .not(z.literal(0))
  change: z.number().int().finite().safe()
    .refine(val => val !== 0, {
      message: "Change cannot be zero"
    }),
  reason: z.string().min(1, 'A reason is required').optional(),
});
// --- END OF FIX ---