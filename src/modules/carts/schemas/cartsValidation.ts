import { z } from 'zod';

export const createCartSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  quantity: z.string().min(1, 'Quantity is required').max(50, 'Quantity is too long'),
  userId: z.string().uuid('User ID must be a valid UUID'),
  labelIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateCartSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID').optional(),
  quantity: z.string().min(1, 'Quantity is required').max(50, 'Quantity is too long').optional(),
  userId: z.string().uuid('User ID must be a valid UUID').optional(),
  labelIds: z.array(z.string().uuid()).optional(),
});

export type CreateCartInput = z.infer<typeof createCartSchema>;
export type UpdateCartInput = z.infer<typeof updateCartSchema>;


