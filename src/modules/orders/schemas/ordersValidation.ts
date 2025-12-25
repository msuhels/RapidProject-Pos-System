import { z } from 'zod';

const orderProductSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  quantity: z.string().min(1, 'Quantity is required').max(50, 'Quantity is too long'),
  price: z.string().min(1, 'Price is required').max(50, 'Price is too long'),
});

export const createOrderSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  orderDate: z.string().optional(),
  products: z.array(orderProductSchema).min(1, 'At least one product is required'),
  labelIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateOrderSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID').optional(),
  orderDate: z.string().optional(),
  products: z.array(orderProductSchema).min(1, 'At least one product is required').optional(),
  labelIds: z.array(z.string().uuid()).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

