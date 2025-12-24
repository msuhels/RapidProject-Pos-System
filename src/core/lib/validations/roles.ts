import { z } from 'zod';

/**
 * Validation schema for creating a role
 */
export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100, 'Role name must be less than 100 characters'),
  code: z.string().min(1, 'Role code is required').max(50, 'Role code must be less than 50 characters').regex(/^[A-Z_]+$/, 'Role code must be uppercase letters and underscores only'),
  description: z.string().optional(),
  tenantId: z.string().uuid('Invalid tenant ID').optional().nullable(),
  parentRoleId: z.string().uuid('Invalid parent role ID').optional().nullable(),
  isSystem: z.boolean().default(false).optional(),
  isDefault: z.boolean().default(false).optional(),
  priority: z.number().int().min(0).max(100).default(0).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional().nullable(),
  status: z.enum(['active', 'inactive', 'deprecated']).default('active').optional(),
});

/**
 * Validation schema for updating a role
 */
export const updateRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100, 'Role name must be less than 100 characters').optional(),
  code: z.string().min(1, 'Role code is required').max(50, 'Role code must be less than 50 characters').regex(/^[A-Z_]+$/, 'Role code must be uppercase letters and underscores only').optional(),
  description: z.string().optional(),
  parentRoleId: z.string().uuid('Invalid parent role ID').optional().nullable(),
  priority: z.number().int().min(0).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional().nullable(),
  status: z.enum(['active', 'inactive', 'deprecated']).optional(),
});

// Type inference from schemas
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
