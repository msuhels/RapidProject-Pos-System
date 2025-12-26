import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Product name is too long'),
  price: z.string().min(1, 'Price is required').max(50, 'Price is too long'),
  costPrice: z.string().max(50, 'Cost price is too long').optional().or(z.literal('')),
  sellingPrice: z.string().max(50, 'Selling price is too long').optional().or(z.literal('')),
  taxRate: z.string().max(50, 'Tax rate is too long').optional().or(z.literal('')),
  discountType: z.enum(['percentage', 'amount']).optional().or(z.literal('')),
  discountValue: z.string().max(50, 'Discount value is too long').optional().or(z.literal('')),
  quantity: z.string().min(1, 'Quantity is required').max(50, 'Quantity is too long'),
  minimumStockQuantity: z.string().min(1, 'Minimum stock quantity is required').max(50, 'Minimum stock quantity is too long'),
  supplierId: z.string().uuid('Invalid supplier ID').optional().or(z.literal('')),
  image: z.string().url('Invalid image URL').optional().or(z.literal('')),
  category: z.string().max(100, 'Category is too long').optional().or(z.literal('')),
  sku: z.string().max(100, 'SKU is too long').optional().or(z.literal('')),
  location: z.string().max(100, 'Location is too long').optional().or(z.literal('')),
  labelIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Product name is too long').optional(),
  price: z.string().min(1, 'Price is required').max(50, 'Price is too long').optional(),
  costPrice: z.string().max(50, 'Cost price is too long').optional().or(z.literal('')),
  sellingPrice: z.string().max(50, 'Selling price is too long').optional().or(z.literal('')),
  taxRate: z.string().max(50, 'Tax rate is too long').optional().or(z.literal('')),
  discountType: z.enum(['percentage', 'amount']).optional().or(z.literal('')),
  discountValue: z.string().max(50, 'Discount value is too long').optional().or(z.literal('')),
  quantity: z.string().min(1, 'Quantity is required').max(50, 'Quantity is too long').optional(),
  minimumStockQuantity: z.string().max(50, 'Minimum stock quantity is too long').optional().or(z.literal('')),
  supplierId: z.string().uuid('Invalid supplier ID').optional().or(z.literal('')),
  image: z.string().url('Invalid image URL').optional().or(z.literal('')),
  category: z.string().max(100, 'Category is too long').optional().or(z.literal('')),
  sku: z.string().max(100, 'SKU is too long').optional().or(z.literal('')),
  location: z.string().max(100, 'Location is too long').optional().or(z.literal('')),
  labelIds: z.array(z.string().uuid()).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

