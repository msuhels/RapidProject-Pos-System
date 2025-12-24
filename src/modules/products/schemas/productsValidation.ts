import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Product name is too long'),
  price: z.string().min(1, 'Price is required').max(50, 'Price is too long'),
  costPrice: z.string().max(50, 'Cost price is too long').optional().or(z.literal('')),
  sellingPrice: z.string().max(50, 'Selling price is too long').optional().or(z.literal('')),
  taxRate: z.string().max(50, 'Tax rate is too long').optional().or(z.literal('')),
  quantity: z.string().min(1, 'Quantity is required').max(50, 'Quantity is too long'),
  image: z.string().url('Invalid image URL').optional().or(z.literal('')),
  category: z.string().max(100, 'Category is too long').optional().or(z.literal('')),
  sku: z.string().max(100, 'SKU is too long').optional().or(z.literal('')),
  location: z.string().max(100, 'Location is too long').optional().or(z.literal('')),
  status: z.string().max(50, 'Status is too long').optional().default('in_stock'),
  labelIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Product name is too long').optional(),
  price: z.string().min(1, 'Price is required').max(50, 'Price is too long').optional(),
  costPrice: z.string().max(50, 'Cost price is too long').optional().or(z.literal('')),
  sellingPrice: z.string().max(50, 'Selling price is too long').optional().or(z.literal('')),
  taxRate: z.string().max(50, 'Tax rate is too long').optional().or(z.literal('')),
  quantity: z.string().min(1, 'Quantity is required').max(50, 'Quantity is too long').optional(),
  image: z.string().url('Invalid image URL').optional().or(z.literal('')),
  category: z.string().max(100, 'Category is too long').optional().or(z.literal('')),
  sku: z.string().max(100, 'SKU is too long').optional().or(z.literal('')),
  location: z.string().max(100, 'Location is too long').optional().or(z.literal('')),
  status: z.string().max(50, 'Status is too long').optional(),
  labelIds: z.array(z.string().uuid()).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

