import { db } from '@/core/lib/db';
import { roles, userRoles } from '@/core/lib/db/baseSchema';
import { eq, and, or, like, isNull, desc, count, lte, gte, sql, ne } from 'drizzle-orm';
import type { Role, NewRole } from '@/core/lib/db/baseSchema';
import type { CreateRoleInput, UpdateRoleInput } from '@/core/lib/validations/roles';

/**
 * Get all roles with optional filtering and pagination
 */
export async function getRoles(options?: {
  search?: string;
  tenantId?: string;
  status?: string;
  limit?: number;
  offset?: number;
  excludeSuperAdmin?: boolean;
}): Promise<{ roles: Role[]; total: number }> {
  const { search, tenantId, status, limit = 100, offset = 0, excludeSuperAdmin = false } = options || {};

  // Build where conditions
  const conditions = [];
  
  if (search) {
    conditions.push(
      or(
        like(roles.name, `%${search}%`),
        like(roles.code, `%${search}%`),
        like(roles.description, `%${search}%`)
      )!
    );
  }
  
  if (tenantId !== undefined) {
    if (tenantId === null) {
      conditions.push(isNull(roles.tenantId));
    } else {
      conditions.push(eq(roles.tenantId, tenantId));
    }
  }
  
  if (status) {
    conditions.push(eq(roles.status, status));
  }

  // Exclude Super Admin role if requested
  if (excludeSuperAdmin) {
    conditions.push(ne(roles.code, 'SUPER_ADMIN'));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(roles)
    .where(whereClause);
  
  const total = totalResult[0]?.count || 0;

  // Get roles
  const rolesList = await db
    .select()
    .from(roles)
    .where(whereClause)
    .orderBy(desc(roles.priority), desc(roles.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    roles: rolesList,
    total,
  };
}

/**
 * Get a single role by ID
 */
export async function getRoleById(id: string): Promise<Role | null> {
  const result = await db
    .select()
    .from(roles)
    .where(eq(roles.id, id))
    .limit(1);
  
  if (result.length === 0) {
    return null;
  }
  
  return result[0];
}

/**
 * Get role with user count
 */
export async function getRoleWithUserCount(id: string) {
  const role = await getRoleById(id);
  
  if (!role) {
    return null;
  }

  const userCount = await getRoleUserCount(id);

  return {
    role,
    userCount,
  };
}

/**
 * Create a new role
 */
export async function createRole(data: CreateRoleInput, createdBy: string): Promise<Role> {
  const result = await db
    .insert(roles)
    .values({
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description || null,
      tenantId: data.tenantId || null,
      parentRoleId: data.parentRoleId || null,
      isSystem: data.isSystem || false,
      isDefault: data.isDefault || false,
      priority: data.priority || 0,
      color: data.color || null,
      status: data.status || 'active',
      metadata: {},
    })
    .returning();
  
  return result[0];
}

/**
 * Update a role
 */
export async function updateRole(
  id: string,
  data: UpdateRoleInput,
  updatedBy: string
): Promise<Role | null> {
  const existing = await getRoleById(id);
  if (!existing) {
    return null;
  }
  
  const updateData: Partial<NewRole> = {
    updatedAt: new Date(),
  };
  
  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  
  if (data.code !== undefined) {
    updateData.code = data.code.toUpperCase();
  }
  
  if (data.description !== undefined) {
    updateData.description = data.description;
  }
  
  if (data.parentRoleId !== undefined) {
    updateData.parentRoleId = data.parentRoleId;
  }
  
  if (data.priority !== undefined) {
    updateData.priority = data.priority;
  }
  
  if (data.color !== undefined) {
    updateData.color = data.color;
  }
  
  if (data.status !== undefined) {
    updateData.status = data.status;
  }
  
  const result = await db
    .update(roles)
    .set(updateData)
    .where(eq(roles.id, id))
    .returning();
  
  return result[0] || null;
}

/**
 * Delete a role (only if not system role and no users assigned)
 */
export async function deleteRole(id: string, deletedBy: string): Promise<boolean> {
  const existing = await getRoleById(id);
  if (!existing) {
    return false;
  }
  
  // Prevent deletion of system roles
  if (existing.isSystem) {
    throw new Error('Cannot delete system roles');
  }
  
  // Check if role has users
  const userCount = await getRoleUserCount(id);
  if (userCount > 0) {
    throw new Error('Cannot delete role with assigned users');
  }
  
  // Delete role (hard delete since it has no users)
  await db
    .delete(roles)
    .where(eq(roles.id, id));
  
  return true;
}

/**
 * Get count of users with a specific role (active assignments only)
 */
export async function getRoleUserCount(roleId: string): Promise<number> {
  const now = new Date();
  
  const result = await db
    .select({ count: count() })
    .from(userRoles)
    .where(
      and(
        eq(userRoles.roleId, roleId),
        eq(userRoles.isActive, true),
        or(
          isNull(userRoles.validFrom),
          lte(userRoles.validFrom, now)
        ),
        or(
          isNull(userRoles.validUntil),
          gte(userRoles.validUntil, now)
        )
      )
    );
  
  return result[0]?.count || 0;
}

/**
 * Get system roles (global roles)
 */
export async function getSystemRoles(): Promise<Role[]> {
  const result = await db
    .select()
    .from(roles)
    .where(
      and(
        eq(roles.isSystem, true),
        isNull(roles.tenantId),
        eq(roles.status, 'active')
      )
    )
    .orderBy(desc(roles.priority));

  return result;
}

/**
 * Get tenant-specific roles
 */
export async function getTenantRoles(tenantId: string): Promise<Role[]> {
  const result = await db
    .select()
    .from(roles)
    .where(
      and(
        eq(roles.tenantId, tenantId),
        eq(roles.status, 'active')
      )
    )
    .orderBy(desc(roles.priority));

  return result;
}
