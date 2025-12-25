import { z } from 'zod';

export const createSupplierSchema = z.object({
  supplierCode: z.string().min(1, 'Supplier code is required').max(100, 'Supplier code must be less than 100 characters'),
  supplierName: z.string().min(1, 'Supplier name is required').max(255, 'Supplier name must be less than 255 characters'),
  email: z.string().email('Invalid email address').max(255, 'Email must be less than 255 characters').optional().or(z.literal('')),
  phone: z.string().max(30, 'Phone must be less than 30 characters').optional(),
  address: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  customFields: z.record(z.any()).optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

