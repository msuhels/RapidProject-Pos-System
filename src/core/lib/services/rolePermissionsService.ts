import { db } from '@/core/lib/db';
import { 
  roleModuleAccess, 
  roleModulePermissions, 
  moduleFields, 
  roleFieldPermissions 
} from '@/core/lib/db/permissionSchema';
import { roles, modules, permissions, rolePermissions as legacyRolePermissions } from '@/core/lib/db/baseSchema';
import { eq, and, inArray } from 'drizzle-orm';

export type DataAccessLevel = 'none' | 'own' | 'team' | 'all';

export interface ModulePermission {
  moduleId: string;
  moduleName: string;
  moduleCode: string;
  moduleIcon?: string | null;
  hasAccess: boolean;
  dataAccess: DataAccessLevel;
  permissions: Array<{
    permissionId: string;
    permissionName: string;
    permissionCode: string;
    granted: boolean;
  }>;
  fields: Array<{
    fieldId: string;
    fieldName: string;
    fieldCode: string;
    fieldLabel: string;
    isVisible: boolean;
    isEditable: boolean;
  }>;
}

export interface RolePermissionsData {
  roleId: string;
  modules: ModulePermission[];
}

/**
 * Get all permissions for a role, organized by module
 * Super Admin automatically gets access to all modules and all permissions
 */
export async function getRolePermissions(roleId: string): Promise<RolePermissionsData> {
  // Check if this is Super Admin role
  const role = await db
    .select()
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);

  const isSuperAdmin = role.length > 0 && role[0].code === 'SUPER_ADMIN';

  // Get all modules
  const allModules = await db
    .select()
    .from(modules)
    .where(eq(modules.isActive, true))
    .orderBy(modules.sortOrder);

  // Get all permissions (needed for Super Admin and to build full matrix)
  const allPermissions = await db
    .select()
    .from(permissions)
    .where(eq(permissions.isActive, true));

  // Get legacy role permissions (role_permissions) for backward compatibility
  const legacyPermissions = await db
    .select()
    .from(legacyRolePermissions)
    .where(eq(legacyRolePermissions.roleId, roleId));

  const legacyPermissionIds = new Set(legacyPermissions.map((p) => p.permissionId));

  // Get module access for this role
  const moduleAccess = await db
    .select()
    .from(roleModuleAccess)
    .where(eq(roleModuleAccess.roleId, roleId));

  // Get module permissions for this role
  const modulePermissions = await db
    .select({
      roleModulePermission: roleModulePermissions,
      permission: permissions,
    })
    .from(roleModulePermissions)
    .innerJoin(permissions, eq(roleModulePermissions.permissionId, permissions.id))
    .where(eq(roleModulePermissions.roleId, roleId));

  // Get module fields
  const allFields = await db
    .select()
    .from(moduleFields)
    .where(eq(moduleFields.isActive, true))
    .orderBy(moduleFields.sortOrder);

  // Get field permissions for this role
  const fieldPermissions = await db
    .select()
    .from(roleFieldPermissions)
    .where(eq(roleFieldPermissions.roleId, roleId));

  // Build the result structure (exclude profile module - it should be viewable and updatable by every user for their own profile)
  const modulesData: ModulePermission[] = allModules
    .filter((module) => module.code.toLowerCase() !== 'profile')
    .map((module) => {
    const access = moduleAccess.find((ma) => ma.moduleId === module.id);
    const modulePerms = modulePermissions.filter((mp) => mp.roleModulePermission.moduleId === module.id);
    const moduleFieldsList = allFields.filter((f) => f.moduleId === module.id);
    const fieldPerms = fieldPermissions.filter((fp) => fp.moduleId === module.id);

    // For Super Admin: grant access to all modules and all permissions/fields
    if (isSuperAdmin) {
      // Get all permissions for this module
      const moduleAllPermissions = allPermissions.filter((p) => p.module === module.code);
      
      return {
        moduleId: module.id,
        moduleName: module.name,
        moduleCode: module.code,
        moduleIcon: module.icon,
        hasAccess: true, // Super Admin has access to all modules
        dataAccess: 'all' as DataAccessLevel, // Super Admin can access all data
        permissions: moduleAllPermissions.map((p) => ({
          permissionId: p.id,
          permissionName: p.name,
          permissionCode: p.code,
          granted: true, // Super Admin has all permissions granted
        })),
        fields: moduleFieldsList.map((field) => ({
          fieldId: field.id,
          fieldName: field.name,
          fieldCode: field.code,
          fieldLabel: field.label || field.name,
          isVisible: true, // Super Admin can see all fields
          isEditable: true, // Super Admin can edit all fields
        })),
      };
    }

    // For other roles: use actual permissions from database
    // NOTE: We do NOT use legacy permissions as fallback - permissions must be explicitly set
    // in the new role_module_access and role_module_permissions tables
    const moduleAllPermissions = allPermissions.filter((p) => p.module === module.code.toLowerCase());

    return {
      moduleId: module.id,
      moduleName: module.name,
      moduleCode: module.code,
      moduleIcon: module.icon,
      // Only grant access if explicitly set in role_module_access table
      hasAccess: access?.hasAccess ?? false,
      // Only set data access if explicitly configured, otherwise 'none'
      dataAccess: (access?.dataAccess as DataAccessLevel) || (access?.hasAccess ? 'team' : 'none'),
      permissions: moduleAllPermissions.map((permission) => {
        const modulePerm = modulePerms.find((mp) => mp.permission.id === permission.id);
        // Only grant permission if explicitly set in role_module_permissions table
        // Do NOT fall back to legacy permissions
        return {
          permissionId: permission.id,
          permissionName: permission.name,
          permissionCode: permission.code,
          granted: modulePerm?.roleModulePermission.granted ?? false,
        };
      }),
      fields: moduleFieldsList.map((field) => {
        const fieldPerm = fieldPerms.find((fp) => fp.fieldId === field.id);
        return {
          fieldId: field.id,
          fieldName: field.name,
          fieldCode: field.code,
          fieldLabel: field.label || field.name,
          isVisible: fieldPerm?.isVisible || false,
          isEditable: fieldPerm?.isEditable || false,
        };
      }),
    };
  });

  return {
    roleId,
    modules: modulesData,
  };
}

/**
 * Get permissions for a specific role and module
 */
export async function getRoleModulePermissions(
  roleId: string,
  moduleId: string
): Promise<ModulePermission | null> {
  const rolePerms = await getRolePermissions(roleId);
  return rolePerms.modules.find((m) => m.moduleId === moduleId) || null;
}

/**
 * Update role module access and permissions
 * OPTIMIZED VERSION: Uses bulk operations, transactions, and upserts for better performance
 */
export async function updateRoleModulePermissions(
  roleId: string,
  moduleId: string,
  data: {
    hasAccess: boolean;
    dataAccess: DataAccessLevel;
    permissions: Array<{
      permissionId: string;
      granted: boolean;
    }>;
    fields: Array<{
      fieldId: string;
      isVisible: boolean;
      isEditable: boolean;
    }>;
  },
  updatedBy: string
): Promise<void> {
  const now = new Date();
  
  // Use a transaction to ensure atomicity and better performance
  await db.transaction(async (tx) => {
    // 1. Upsert module access (single operation using onConflictDoUpdate)
    await tx
      .insert(roleModuleAccess)
      .values({
        roleId,
        moduleId,
        hasAccess: data.hasAccess,
        dataAccess: data.dataAccess,
        createdBy: updatedBy,
        updatedBy,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [roleModuleAccess.roleId, roleModuleAccess.moduleId],
        set: {
          hasAccess: data.hasAccess,
          dataAccess: data.dataAccess,
          updatedAt: now,
          updatedBy,
        },
      });

    // 2. Bulk update permissions: Delete all existing, then bulk insert
    // This is faster than checking each one individually
    const validPermissions = data.permissions.filter((p) => p?.permissionId);
    
    // Delete all existing permissions for this role+module
    await tx
      .delete(roleModulePermissions)
      .where(
        and(
          eq(roleModulePermissions.roleId, roleId),
          eq(roleModulePermissions.moduleId, moduleId)
        )
      );

    // Bulk insert only granted permissions
    if (validPermissions.length > 0) {
      const permissionsToInsert = validPermissions
        .filter((p) => p.granted)
        .map((p) => ({
          roleId,
          moduleId,
          permissionId: p.permissionId,
          granted: true,
          createdBy: updatedBy,
          updatedBy,
          createdAt: now,
          updatedAt: now,
        }));

      if (permissionsToInsert.length > 0) {
        await tx.insert(roleModulePermissions).values(permissionsToInsert);
      }
    }

    // 3. Bulk update field permissions: Delete all existing, then bulk insert
    const validFields = data.fields.filter((f) => f?.fieldId);
    
    // Delete all existing field permissions for this role+module
    await tx
      .delete(roleFieldPermissions)
      .where(
        and(
          eq(roleFieldPermissions.roleId, roleId),
          eq(roleFieldPermissions.moduleId, moduleId)
        )
      );

    // Bulk insert all field permissions (if any)
    if (validFields.length > 0) {
      const fieldsToInsert = validFields.map((f) => ({
        roleId,
        moduleId,
        fieldId: f.fieldId,
        isVisible: f.isVisible,
        isEditable: f.isEditable && f.isVisible, // Editable requires visible
        createdBy: updatedBy,
        updatedBy,
        createdAt: now,
        updatedAt: now,
      }));

      await tx.insert(roleFieldPermissions).values(fieldsToInsert);
    }
  });
}

/**
 * Get all permissions for a module
 */
export async function getModulePermissions(moduleCode: string) {
  return await db
    .select()
    .from(permissions)
    .where(and(
      eq(permissions.module, moduleCode),
      eq(permissions.isActive, true)
    ));
}

/**
 * Get all fields for a module
 */
export async function getModuleFields(moduleId: string) {
  return await db
    .select()
    .from(moduleFields)
    .where(and(
      eq(moduleFields.moduleId, moduleId),
      eq(moduleFields.isActive, true)
    ))
    .orderBy(moduleFields.sortOrder);
}

