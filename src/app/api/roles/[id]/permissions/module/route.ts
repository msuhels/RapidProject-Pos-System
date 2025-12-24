import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { userHasPermission } from '@/core/lib/permissions';
import { db } from '@/core/lib/db';
import {
  modules,
  permissions,
  rolePermissions as legacyRolePermissions,
} from '@/core/lib/db/baseSchema';
import {
  getRolePermissions,
  updateRoleModulePermissions,
  type DataAccessLevel,
} from '@/core/lib/services/rolePermissionsService';
import { and, eq, inArray } from 'drizzle-orm';

type IncomingPermission = {
  permissionId: string;
  granted: boolean;
};

type IncomingField = {
  fieldId: string;
  isVisible: boolean;
  isEditable: boolean;
};

type IncomingModulePayload = {
  moduleId: string;
  hasAccess?: boolean;
  dataAccess?: DataAccessLevel | string;
  permissions?: IncomingPermission[];
  fields?: IncomingField[];
};

/**
 * PUT /api/roles/:id/permissions/module
 *
 * Optimized endpoint to update permissions for a single module (or a small set of modules)
 * for a given role. This is used by the enhanced permission assignment UI to avoid
 * re-writing all modules for a role on every save.
 *
 * IMPORTANT:
 * - This endpoint intentionally keeps the existing /api/roles/:id/permissions
 *   implementation untouched so we can switch between them safely.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireAuth()(request);
    if (userId instanceof NextResponse) {
      return userId;
    }

    // Check permission
    const hasPermission = await userHasPermission(userId, 'roles:update');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - roles:update permission required' },
        { status: 403 },
      );
    }

    const { id: roleId } = await params;
    const body = await request.json();

    const modulesPayloadRaw = Array.isArray(body.modules) ? body.modules : [];
    const modulesPayload: IncomingModulePayload[] = modulesPayloadRaw.filter(
      (m: any): m is IncomingModulePayload => !!m?.moduleId,
    );

    if (modulesPayload.length === 0) {
      return NextResponse.json(
        { error: 'No modules provided for update' },
        { status: 400 },
      );
    }

    const isValidDataAccess = (value: unknown): value is DataAccessLevel =>
      value === 'none' || value === 'own' || value === 'team' || value === 'all';

    // For each module in the payload, update the fine-grained permission tables
    // and then selectively sync the legacy role_permissions table only for that module.
    for (const moduleData of modulesPayload) {
      const permissionsArray = Array.isArray(moduleData.permissions)
        ? moduleData.permissions
        : [];
      const fieldsArray = Array.isArray(moduleData.fields)
        ? moduleData.fields
        : [];

      const hasAccess =
        typeof moduleData.hasAccess === 'boolean'
          ? moduleData.hasAccess
          : permissionsArray.some((p) => p?.granted);

      const dataAccess: DataAccessLevel = isValidDataAccess(moduleData.dataAccess)
        ? moduleData.dataAccess
        : hasAccess
          ? 'team'
          : 'none';

      const normalizedPermissions: IncomingPermission[] = permissionsArray
        .filter((p) => p?.permissionId)
        .map((p) => ({
          permissionId: p.permissionId as string,
          granted: Boolean(p.granted),
        }));

      const normalizedFields: IncomingField[] = fieldsArray
        .filter((f) => f?.fieldId)
        .map((f) => ({
          fieldId: f.fieldId as string,
          isVisible: Boolean(f.isVisible),
          isEditable: Boolean(f.isEditable) && Boolean(f.isVisible),
        }));

      // Persist into the new RBAC tables
      await updateRoleModulePermissions(
        roleId,
        moduleData.moduleId as string,
        {
          hasAccess,
          dataAccess,
          permissions: normalizedPermissions,
          fields: normalizedFields,
        },
        userId,
      );

      // --- Legacy table sync (role_permissions) for this module only ---
      // 1. Find the module row so we can determine its code.
      const moduleRow = await db
        .select()
        .from(modules)
        .where(eq(modules.id, moduleData.moduleId))
        .limit(1);

      if (moduleRow.length === 0) {
        // If module is missing, skip legacy sync for this entry.
        continue;
      }

      const moduleCodeLower = moduleRow[0].code.toLowerCase();

      // 2. Find all permission IDs that belong to this module.
      const modulePermissionsRows = await db
        .select({ id: permissions.id })
        .from(permissions)
        .where(eq(permissions.module, moduleCodeLower));

      const modulePermissionIds = modulePermissionsRows.map((p) => p.id);

      if (modulePermissionIds.length === 0) {
        continue;
      }

      // 3. Delete existing legacy role_permissions entries for this role+module.
      await db
        .delete(legacyRolePermissions)
        .where(
          and(
            eq(legacyRolePermissions.roleId, roleId),
            inArray(legacyRolePermissions.permissionId, modulePermissionIds),
          ),
        );

      // 4. Insert the newly granted permissions for this module.
      const grantedPermissionIds = normalizedPermissions
        .filter((p) => p.granted)
        .map((p) => p.permissionId);

      if (grantedPermissionIds.length > 0) {
        await db.insert(legacyRolePermissions).values(
          grantedPermissionIds.map((permissionId) => ({
            roleId,
            permissionId,
            conditions: null,
          })),
        );
      }
    }

    // Return success without fetching all permissions (much faster)
    // The frontend can reload if needed, or we can add a separate lightweight endpoint
    // to fetch just the updated module's permissions
    return NextResponse.json({
      success: true,
      message: 'Module permissions updated successfully',
      // Don't return full permissions - let frontend reload if needed
      // This saves significant time (getRolePermissions is expensive)
    });
  } catch (error) {
    console.error('Update role module permissions (per-module) error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}


