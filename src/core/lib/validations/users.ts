import { z } from 'zod';

/**
 * Validation schema for creating a user
 */
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required').max(255, 'Full name must be less than 255 characters'),
  tenantId: z.string().uuid('Invalid tenant ID').optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).default('active').optional(),
  roleId: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().uuid('Invalid role ID').optional()
  ),
});

/**
 * Validation schema for updating a user
 */
export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  // For updates we allow profile fields to be cleared (set to null) via the UI,
  // so most string fields are nullable + optional. Creation rules remain strict
  // in createUserSchema above.
  fullName: z
    .preprocess(
      (val) => (val === '' || val === null ? null : val),
      z.string().max(255, 'Full name must be less than 255 characters').nullable()
    )
    .optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  timezone: z.string().max(50).nullable().optional(),
  locale: z.string().max(10).nullable().optional(),
  // Extended profile fields (used for profile editing, not required for registration)
  phoneNumber: z.string().max(30).nullable().optional(),
  jobTitle: z.string().max(100).nullable().optional(),
  department: z.string().max(100).nullable().optional(),
  companyName: z.string().max(255).nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
  addressLine1: z.string().max(255).nullable().optional(),
  addressLine2: z.string().max(255).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  postalCode: z.string().max(20).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  roleId: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().uuid('Invalid role ID').optional()
  ),
});

/**
 * Validation schema for assigning a role to a user
 */
export const assignRoleSchema = z.object({
  roleId: z.string().uuid('Invalid role ID'),
  validUntil: z.string().datetime().optional(),
});

// Type inference from schemas
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
