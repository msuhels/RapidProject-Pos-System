import { db } from './db';
import { 
  users, 
  roles, 
  permissions, 
  rolePermissions,
  userRoles,
  resourcePermissions,
  modules,
} from './db/baseSchema';
import { roleModuleAccess, roleModulePermissions } from './db/permissionSchema';
import { eq, and, isNull, or, lte, gte, sql, inArray } from 'drizzle-orm';

/**
 * Get all permissions for a user through their roles (with hierarchy support)
 * Supports:
 * - Multiple roles per user via user_roles
 * - Role hierarchy (parent roles)
 * - Temporal access (valid_from, valid_until)
 * - Wildcard permissions (e.g., users:* matches users:create, users:read, etc.)
 */
export async function getUserPermissions(userId: string, tenantId?: string): Promise<string[]> {
  const now = new Date();
  
  // Get user's active roles with hierarchy (up to 5 levels deep)
  const userRolesQuery = db
    .select({
      roleId: roles.id,
      roleCode: roles.code,
      parentRoleId: roles.parentRoleId,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(
      and(
        eq(userRoles.userId, userId),
        tenantId ? eq(userRoles.tenantId, tenantId) : sql`true`,
        eq(userRoles.isActive, true),
        or(
          isNull(userRoles.validFrom),
          lte(userRoles.validFrom, now)
        ),
        or(
          isNull(userRoles.validUntil),
          gte(userRoles.validUntil, now)
        ),
        eq(roles.status, 'active')
      )
    );

  const directRoles = await userRolesQuery;
  
  // Build role hierarchy (include parent roles)
  const allRoleIds = new Set<string>();
  const rolesToProcess = [...directRoles];
  const processedRoles = new Set<string>();
  let depth = 0;
  const maxDepth = 5;

  while (rolesToProcess.length > 0 && depth < maxDepth) {
    const currentRole = rolesToProcess.shift()!;
    
    if (processedRoles.has(currentRole.roleId)) {
      continue;
    }
    
    allRoleIds.add(currentRole.roleId);
    processedRoles.add(currentRole.roleId);
    
    // If role has a parent, fetch and add it to process
    if (currentRole.parentRoleId) {
      const parentRole = await db
        .select({
          roleId: roles.id,
          roleCode: roles.code,
          parentRoleId: roles.parentRoleId,
        })
        .from(roles)
        .where(
          and(
            eq(roles.id, currentRole.parentRoleId),
            eq(roles.status, 'active')
          )
        )
        .limit(1);
      
      if (parentRole.length > 0) {
        rolesToProcess.push(parentRole[0]);
      }
    }
    
    depth++;
  }

  // Check if user is SUPER_ADMIN (bypass all checks)
  const isSuperAdmin = directRoles.some(r => r.roleCode === 'SUPER_ADMIN');
  if (isSuperAdmin) {
    // Return all permissions for super admin
    const allPerms = await db
      .select({ code: permissions.code })
      .from(permissions)
      .where(eq(permissions.isActive, true));
    return allPerms.map(p => p.code);
  }

  if (allRoleIds.size === 0) {
    return [];
  }

  // NEW PERMISSION SYSTEM: Check role_module_access and role_module_permissions first
  // Get all modules that have entries in the new permission system for this role
  const roleIdsArray = Array.from(allRoleIds);
  const moduleAccessEntries = roleIdsArray.length > 0
    ? await db
        .select({
          moduleId: roleModuleAccess.moduleId,
          moduleCode: modules.code,
          hasAccess: roleModuleAccess.hasAccess,
        })
        .from(roleModuleAccess)
        .innerJoin(modules, eq(roleModuleAccess.moduleId, modules.id))
        .where(inArray(roleModuleAccess.roleId, roleIdsArray))
    : [];

  // Only get permissions for modules where hasAccess is true
  const accessibleModuleIds = moduleAccessEntries
    .filter(m => m.hasAccess)
    .map(m => m.moduleId);

  // Get all granted permissions from the new system (only for accessible modules)
  const newSystemPermissions = accessibleModuleIds.length > 0 && roleIdsArray.length > 0
    ? await db
    .select({ code: permissions.code })
        .from(roleModulePermissions)
        .innerJoin(permissions, eq(roleModulePermissions.permissionId, permissions.id))
        .where(
          and(
            inArray(roleModulePermissions.roleId, roleIdsArray),
            inArray(roleModulePermissions.moduleId, accessibleModuleIds),
            eq(roleModulePermissions.granted, true),
            eq(permissions.isActive, true)
          )
        )
    : [];

  const newSystemPermissionCodes = new Set(newSystemPermissions.map(p => p.code));
  // Track modules that have ANY entry in new system (even if hasAccess is false)
  // This prevents legacy permissions from being used for these modules
  const modulesWithNewSystem = new Set(moduleAccessEntries.map(m => m.moduleCode.toLowerCase()));

  // LEGACY PERMISSION SYSTEM: Only use for modules NOT in the new system
  // Get all permissions from legacy system
  const legacyPermissions = roleIdsArray.length > 0
    ? await db
        .select({ 
          code: permissions.code,
          module: permissions.module,
        })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
            inArray(rolePermissions.roleId, roleIdsArray),
        eq(permissions.isActive, true)
      )
        )
    : [];

  // Filter legacy permissions: only include modules that DON'T have entries in new system
  const legacyPermissionCodes = legacyPermissions
    .filter(p => !modulesWithNewSystem.has(p.module.toLowerCase()))
    .map(p => p.code);

  // Combine: new system permissions + legacy permissions for modules not in new system
  const allPermissionCodes = Array.from(new Set([
    ...Array.from(newSystemPermissionCodes),
    ...legacyPermissionCodes,
  ]));

  return allPermissionCodes;
}

/**
 * Check if user has a specific permission
 * Supports wildcard matching: users:* matches users:create, users:read, etc.
 * SUPER_ADMIN always returns true (bypasses all permission checks)
 */
export async function userHasPermission(
  userId: string, 
  permissionCode: string,
  tenantId?: string,
  resourceType?: string,
  resourceId?: string
): Promise<boolean> {
  // Check resource-level permission first (highest priority)
  if (resourceType && resourceId) {
    const now = new Date();
    const resourcePerm = await db
      .select()
      .from(resourcePermissions)
      .where(
        and(
          eq(resourcePermissions.userId, userId),
          eq(resourcePermissions.resourceType, resourceType),
          eq(resourcePermissions.resourceId, resourceId),
          eq(resourcePermissions.permissionCode, permissionCode),
          tenantId ? eq(resourcePermissions.tenantId, tenantId) : sql`true`,
          or(
            isNull(resourcePermissions.validFrom),
            lte(resourcePermissions.validFrom, now)
          ),
          or(
            isNull(resourcePermissions.validUntil),
            gte(resourcePermissions.validUntil, now)
          )
        )
      )
      .limit(1);
    
    if (resourcePerm.length > 0) {
      return true;
    }
  }

  // Get user's permissions (includes role hierarchy)
  const userPermissions = await getUserPermissions(userId, tenantId);
  
  // Check for exact match
  if (userPermissions.includes(permissionCode)) {
    return true;
  }
  
  // Check for wildcard match (e.g., users:* matches users:create)
  const module = permissionCode.split(':')[0];
  const wildcardPermission = `${module}:*`;
  
  if (userPermissions.includes(wildcardPermission)) {
    return true;
  }
  
  // Check for admin wildcard (admin:* grants everything)
  if (userPermissions.includes('admin:*')) {
    return true;
  }
  
  return false;
}

/**
 * Check if user has any of the specified permissions
 * SUPER_ADMIN always returns true (bypasses all permission checks)
 */
export async function userHasAnyPermission(
  userId: string, 
  permissionCodes: string[],
  tenantId?: string
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId, tenantId);
  
  // Check for admin wildcard first
  if (userPermissions.includes('admin:*')) {
    return true;
  }
  
  for (const code of permissionCodes) {
    // Check exact match
    if (userPermissions.includes(code)) {
      return true;
    }
    
    // Check wildcard match
    const module = code.split(':')[0];
    const wildcardPermission = `${module}:*`;
    if (userPermissions.includes(wildcardPermission)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if user has all of the specified permissions
 * SUPER_ADMIN always returns true (bypasses all permission checks)
 */
export async function userHasAllPermissions(
  userId: string, 
  permissionCodes: string[],
  tenantId?: string
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId, tenantId);
  
  // Check for admin wildcard first
  if (userPermissions.includes('admin:*')) {
    return true;
  }
  
  for (const code of permissionCodes) {
    // Check exact match
    const hasExact = userPermissions.includes(code);
    
    // Check wildcard match
    const module = code.split(':')[0];
    const wildcardPermission = `${module}:*`;
    const hasWildcard = userPermissions.includes(wildcardPermission);
    
    if (!hasExact && !hasWildcard) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get user's role(s) - returns all active roles for the user
 */
export async function getUserRoles(userId: string, tenantId?: string): Promise<Array<{ id: string; name: string; code: string; priority: number }>> {
  const now = new Date();
  
  const result = await db
    .select({
      id: roles.id,
      name: roles.name,
      code: roles.code,
      priority: roles.priority,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(
      and(
        eq(userRoles.userId, userId),
        tenantId ? eq(userRoles.tenantId, tenantId) : sql`true`,
        eq(userRoles.isActive, true),
        or(
          isNull(userRoles.validFrom),
          lte(userRoles.validFrom, now)
        ),
        or(
          isNull(userRoles.validUntil),
          gte(userRoles.validUntil, now)
        ),
        eq(roles.status, 'active')
      )
    )
    .orderBy(sql`${roles.priority} DESC`);

  return result;
}

/**
 * Check if user is a Super Admin
 */
export async function isUserSuperAdmin(userId: string): Promise<boolean> {
  const userRolesList = await getUserRoles(userId);
  return userRolesList.some(role => role.code === 'SUPER_ADMIN');
}

/**
 * Get user's primary role (highest priority)
 */
export async function getUserRole(userId: string, tenantId?: string): Promise<{ id: string; name: string; code: string; priority: number } | null> {
  const roles = await getUserRoles(userId, tenantId);
  return roles.length > 0 ? roles[0] : null;
}

/**
 * Check if user has a specific role
 */
export async function userHasRole(userId: string, roleCode: string, tenantId?: string): Promise<boolean> {
  const userRolesList = await getUserRoles(userId, tenantId);
  return userRolesList.some((role) => role.code === roleCode);
}

/**
 * Get user permissions with module information
 */
export async function getUserPermissionsWithModules(userId: string, tenantId?: string): Promise<Array<{
  permissionCode: string;
  permissionName: string;
  module: string;
  action: string;
  resource: string | null;
}>> {
  const permissionCodes = await getUserPermissions(userId, tenantId);
  
  if (permissionCodes.length === 0) {
    return [];
  }

  const result = await db
    .select({
      permissionCode: permissions.code,
      permissionName: permissions.name,
      module: permissions.module,
      action: permissions.action,
      resource: permissions.resource,
    })
    .from(permissions)
    .where(
      and(
        sql`${permissions.code} IN (${sql.join(permissionCodes.map(code => sql`${code}`), sql`, `)})`,
        eq(permissions.isActive, true)
      )
    );

  return result;
}

/**
 * Check if user belongs to a specific tenant
 */
export async function userBelongsToTenant(userId: string, tenantId: string): Promise<boolean> {
  const user = await db
    .select({ tenantId: users.tenantId })
    .from(users)
    .where(
      and(
        eq(users.id, userId),
        isNull(users.deletedAt)
      )
    )
    .limit(1);
  
  if (user.length === 0) {
    return false;
  }
  
  // Super admin (no tenant) can access all tenants
  if (user[0].tenantId === null) {
    return true;
  }
  
  return user[0].tenantId === tenantId;
}

/**
 * Get user's tenant ID
 */
export async function getUserTenantId(userId: string): Promise<string | null> {
  const user = await db
    .select({ tenantId: users.tenantId })
    .from(users)
    .where(
      and(
        eq(users.id, userId),
        isNull(users.deletedAt)
      )
    )
    .limit(1);
  
  return user.length > 0 ? user[0].tenantId : null;
}
