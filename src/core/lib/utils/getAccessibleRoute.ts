import { getUserPermissions, getUserRoles, getUserTenantId } from '@/core/lib/permissions';
import { db } from '@/core/lib/db';
import { modules } from '@/core/lib/db/baseSchema';
import { eq } from 'drizzle-orm';

/**
 * Get the first accessible route for a user based on their permissions
 * Returns the route path the user has access to, or null if no accessible routes
 */
export async function getFirstAccessibleRoute(userId: string): Promise<string | null> {
  try {
    // Get user's roles
    const tenantId = await getUserTenantId(userId);
    const userRoles = await getUserRoles(userId, tenantId || undefined);

    if (userRoles.length === 0) {
      return null;
    }

    // Check if user is Super Admin
    const isSuperAdmin = userRoles.some(role => role.code === 'SUPER_ADMIN');

    // Get all active modules from database
    const allModules = await db
      .select()
      .from(modules)
      .where(eq(modules.isActive, true))
      .orderBy(modules.sortOrder);

    // If Super Admin, return dashboard (they have access to everything)
    if (isSuperAdmin) {
      return '/dashboard';
    }

    // Get user permissions
    const userPermissions = await getUserPermissions(userId, tenantId || undefined);

    // Define route priority order (most important first)
    const routePriority = [
      { moduleCode: 'dashboard', path: '/dashboard', permission: 'dashboard:read' },
      { moduleCode: 'profile', path: '/profile', permission: 'profile:read' },
      { moduleCode: 'users', path: '/users', permission: 'users:read' },
      { moduleCode: 'roles', path: '/roles', permission: 'roles:read' },
      { moduleCode: 'settings', path: '/settings/general', permission: 'settings:read' },
    ];

    // Check each route in priority order
    for (const route of routePriority) {
      const hasPermission = 
        userPermissions.includes(route.permission) ||
        userPermissions.includes(`${route.moduleCode}:*`) ||
        userPermissions.includes('admin:*');

      if (hasPermission) {
        // For settings, check if user has access to any submenu
        if (route.moduleCode === 'settings') {
          const settingsSubmenus = [
            { path: '/settings/general', permission: 'settings:general:read' },
            { path: '/settings/registration', permission: 'settings:registration:read' },
            { path: '/settings/notification-methods', permission: 'settings:notification-methods:read' },
            { path: '/settings/smtp-settings', permission: 'settings:smtp-settings:read' },
            { path: '/settings/custom-fields', permission: 'settings:custom-fields:read' },
          ];

          // Check for first accessible settings submenu
          for (const submenu of settingsSubmenus) {
            const hasSubmenuPermission =
              userPermissions.includes(submenu.permission) ||
              userPermissions.includes('settings:*') ||
              userPermissions.includes('admin:*');

            if (hasSubmenuPermission) {
              return submenu.path;
            }
          }
        } else {
          return route.path;
        }
      }
    }

    // Check dynamic modules
    for (const module of allModules) {
      const moduleCode = module.code.toLowerCase();
      
      // Skip core modules we already checked
      if (['dashboard', 'profile', 'users', 'roles', 'settings'].includes(moduleCode)) {
        continue;
      }

      const readPermission = `${moduleCode}:read`;
      const wildcardPermission = `${moduleCode}:*`;

      const hasPermission = 
        userPermissions.includes(readPermission) ||
        userPermissions.includes(wildcardPermission) ||
        userPermissions.includes('admin:*');

      if (hasPermission) {
        return `/${moduleCode}`;
      }
    }

    // If no accessible route found, return profile as fallback (users should always have access to their profile)
    // If they don't have profile access either, return null
    return null;
  } catch (error) {
    console.error('[getFirstAccessibleRoute] Error:', error);
    return null;
  }
}

