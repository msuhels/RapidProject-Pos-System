import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  phoneNumber: z.string().max(30, 'Phone number must be less than 30 characters').optional(),
  email: z.string().email('Invalid email address').max(255, 'Email must be less than 255 characters').optional().or(z.literal('')),
  totalPurchases: z.number().min(0, 'Total purchases cannot be negative').optional(),
  outstandingBalance: z.number().min(0, 'Outstanding balance cannot be negative').optional(),
  isActive: z.boolean().optional(),
  customFields: z.record(z.any()).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;


