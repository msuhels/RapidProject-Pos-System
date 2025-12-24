import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { userHasPermission } from '@/core/lib/permissions';
import { db } from '@/core/lib/db';
import { modules, permissions } from '@/core/lib/db/baseSchema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/modules
 * Get all modules with their permissions
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()(request);
    if (userId instanceof NextResponse) {
      return userId;
    }

    // Get all active modules
    const allModules = await db
      .select()
      .from(modules)
      .where(eq(modules.isActive, true))
      .orderBy(modules.sortOrder);

    // Get all permissions
    const allPermissions = await db
      .select()
      .from(permissions)
      .where(eq(permissions.isActive, true));

    // Group permissions by module
    const modulesWithPermissions = allModules.map(module => {
      const moduleCode = module.code.toLowerCase();
      const modulePerms = allPermissions.filter(p => p.module === moduleCode);

      return {
        id: module.id,
        name: module.name,
        code: module.code,
        description: module.description,
        icon: module.icon,
        sortOrder: module.sortOrder,
        isActive: module.isActive,
        permissions: modulePerms.map(perm => ({
          id: perm.id,
          code: perm.code,
          name: perm.name,
          action: perm.action,
          resource: perm.resource,
          isDangerous: perm.isDangerous,
          requiresMfa: perm.requiresMfa,
          description: perm.description,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      modules: modulesWithPermissions,
    });
  } catch (error) {
    console.error('Get modules error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

