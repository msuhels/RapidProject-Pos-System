import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/core/middleware/auth';
import { db } from '@/core/lib/db';
import { userRoles, roles, modules } from '@/core/lib/db/baseSchema';
import { moduleFields, roleFieldPermissions } from '@/core/lib/db/permissionSchema';
import { eq, and, inArray } from 'drizzle-orm';

export interface FieldPermission {
  moduleCode: string;
  moduleName: string;
  fields: {
    fieldCode: string;
    fieldName: string;
    fieldLabel: string;
    isVisible: boolean;
    isEditable: boolean;
  }[];
}

/**
 * GET /api/auth/field-permissions
 * Get field-level permissions for the current user across all modules
 * Query params:
 * - moduleCode: Optional - filter by specific module
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const moduleCodeFilter = url.searchParams.get('moduleCode');

    // Get all user's active roles
    const userRolesData = await db
      .select({
        roleId: userRoles.roleId,
        roleCode: roles.code,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.isActive, true),
          eq(roles.status, 'active')
        )
      );

    if (userRolesData.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const roleIds = userRolesData.map((r) => r.roleId);
    const isSuperAdmin = userRolesData.some((r) => r.roleCode === 'SUPER_ADMIN');

    // Get all active modules
    let modulesQuery = db
      .select()
      .from(modules)
      .where(eq(modules.isActive, true));

    const allModules = await modulesQuery;
    
    // Filter by specific module if requested
    const filteredModules = moduleCodeFilter
      ? allModules.filter((m) => m.code.toLowerCase() === moduleCodeFilter.toLowerCase())
      : allModules;

    // Get all fields for these modules
    const moduleIds = filteredModules.map((m) => m.id);
    const allFields = await db
      .select()
      .from(moduleFields)
      .where(
        and(
          inArray(moduleFields.moduleId, moduleIds),
          eq(moduleFields.isActive, true)
        )
      )
      .orderBy(moduleFields.sortOrder);

    let fieldPermsMap: Map<string, { isVisible: boolean; isEditable: boolean }>;

    if (isSuperAdmin) {
      // Super Admin can see and edit all fields
      fieldPermsMap = new Map(
        allFields.map((f) => [f.id, { isVisible: true, isEditable: true }])
      );
    } else {
      // Get field permissions for user's roles
      const fieldPerms = await db
        .select()
        .from(roleFieldPermissions)
        .where(
          and(
            inArray(roleFieldPermissions.roleId, roleIds),
            inArray(roleFieldPermissions.moduleId, moduleIds)
          )
        );

      // Aggregate permissions across roles (if user has multiple roles, use OR logic)
      fieldPermsMap = new Map();
      for (const fieldPerm of fieldPerms) {
        const existing = fieldPermsMap.get(fieldPerm.fieldId);
        fieldPermsMap.set(fieldPerm.fieldId, {
          isVisible: existing?.isVisible || fieldPerm.isVisible,
          isEditable: existing?.isEditable || fieldPerm.isEditable,
        });
      }
    }

    // Build response structure
    const result: FieldPermission[] = filteredModules.map((module) => {
      const moduleFieldsList = allFields.filter((f) => f.moduleId === module.id);
      
      return {
        moduleCode: module.code,
        moduleName: module.name,
        fields: moduleFieldsList.map((field) => {
          const perms = fieldPermsMap.get(field.id) || {
            isVisible: false,
            isEditable: false,
          };
          
          return {
            fieldCode: field.code,
            fieldName: field.name,
            fieldLabel: field.label || field.name,
            isVisible: perms.isVisible,
            isEditable: perms.isEditable,
          };
        }),
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching field permissions:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch field permissions',
      },
      { status: 500 }
    );
  }
}

