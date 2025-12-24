import { z } from 'zod';

export const createInventorySchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  sku: z.string().max(100, 'SKU is too long').optional(),
  location: z.string().max(100, 'Location is too long').optional(),
  quantity: z
    .string()
    .min(1, 'Quantity is required')
    .max(50, 'Quantity is too long'),
  status: z
    .string()
    .min(1, 'Status is required')
    .max(50, 'Status is too long')
    .optional()
    .default('in_stock'),
  labelIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateInventorySchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID').optional(),
  sku: z.string().max(100, 'SKU is too long').optional(),
  location: z.string().max(100, 'Location is too long').optional(),
  quantity: z
    .string()
    .min(1, 'Quantity is required')
    .max(50, 'Quantity is too long')
    .optional(),
  status: z.string().max(50, 'Status is too long').optional(),
  labelIds: z.array(z.string().uuid()).optional(),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;


