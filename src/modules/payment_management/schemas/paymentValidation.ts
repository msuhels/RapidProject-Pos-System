import { z } from 'zod';

export const paymentStatusSchema = z.enum(['paid', 'partial', 'refunded']);

export const createPaymentSchema = z.object({
  saleReference: z.string().min(1, 'Sale reference is required').max(255, 'Sale reference must be less than 255 characters'),
  paymentMethodId: z.string().uuid('Invalid payment method ID'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentStatus: paymentStatusSchema.optional(),
  transactionReference: z.string().max(255).nullable().optional(),
  paymentDate: z.string().datetime().optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  customFields: z.record(z.any()).optional(),
});

export const updatePaymentSchema = z.object({
  paymentStatus: paymentStatusSchema.optional(),
  amount: z.number().min(0.01, 'Amount must be greater than 0').optional(),
  transactionReference: z.string().max(255).nullable().optional(),
  paymentDate: z.string().datetime().optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  customFields: z.record(z.any()).optional(),
});

export const createPaymentMethodSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  isActive: z.boolean().optional(),
  supportsRefund: z.boolean().optional(),
});

export const updatePaymentMethodSchema = createPaymentMethodSchema.partial();

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>;
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>;


