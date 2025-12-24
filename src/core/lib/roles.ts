import { db } from './db';
import { roles } from './db/baseSchema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * Get the default role for new registrations (is_default = true)
 */
export async function getDefaultUserRole(tenantId?: string): Promise<{ id: string; name: string; code: string } | null> {
  const result = await db
    .select({ 
      id: roles.id,
      name: roles.name,
      code: roles.code,
    })
    .from(roles)
    .where(
      and(
        eq(roles.isDefault, true),
        tenantId ? eq(roles.tenantId, tenantId) : isNull(roles.tenantId),
        eq(roles.status, 'active')
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get role by code
 */
export async function getRoleByCode(code: string, tenantId?: string): Promise<{ id: string; name: string; code: string } | null> {
  const result = await db
    .select({ 
      id: roles.id,
      name: roles.name,
      code: roles.code,
    })
    .from(roles)
    .where(
      and(
        eq(roles.code, code),
        tenantId ? eq(roles.tenantId, tenantId) : isNull(roles.tenantId),
        eq(roles.status, 'active')
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get role by ID
 */
export async function getRoleById(id: string): Promise<{ id: string; name: string; code: string; tenantId: string | null; isSystem: boolean } | null> {
  const result = await db
    .select({
      id: roles.id,
      name: roles.name,
      code: roles.code,
      tenantId: roles.tenantId,
      isSystem: roles.isSystem,
    })
    .from(roles)
    .where(
      and(
        eq(roles.id, id),
        eq(roles.status, 'active')
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Check if a role is a system role
 */
export async function isSystemRole(roleId: string): Promise<boolean> {
  const role = await getRoleById(roleId);
  return role ? role.isSystem : false;
}

/**
 * Get all system roles (global roles that apply across tenants)
 */
export async function getSystemRoles(): Promise<Array<{ id: string; name: string; code: string; priority: number }>> {
  const result = await db
    .select({
      id: roles.id,
      name: roles.name,
      code: roles.code,
      priority: roles.priority,
    })
    .from(roles)
    .where(
      and(
        eq(roles.isSystem, true),
        isNull(roles.tenantId),
        eq(roles.status, 'active')
      )
    )
    .orderBy(roles.priority);

  return result;
}
