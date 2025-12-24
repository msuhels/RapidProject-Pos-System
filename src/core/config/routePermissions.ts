/**
 * Route Permission Mapping
 * 
 * Maps routes to their required permissions for access control.
 * This is used by middleware to check if a user has permission to access a route.
 * 
 * Format: Route path -> Required permission(s)
 * - Use exact paths: '/dashboard' -> 'dashboard:read'
 * - Use path prefixes: '/settings' -> 'settings:read' (will match /settings/*)
 * - Use arrays for multiple permissions (user needs any of them)
 */

export interface RoutePermissionConfig {
  route: string | RegExp;
  permission: string | string[];
  exact?: boolean; // If true, only exact match. If false, matches sub-routes
}

export const routePermissions: RoutePermissionConfig[] = [
  // Dashboard
  { route: '/dashboard', permission: 'dashboard:read', exact: false },
  
  // Profile
  { route: '/profile', permission: 'profile:read', exact: false },
  
  // User Management
  { route: '/users', permission: 'users:read', exact: false },
  
  // Role Management
  { route: '/roles', permission: 'roles:read', exact: false },
  
  // Settings - Main
  { route: '/settings', permission: 'settings:read', exact: false },
  
  // Settings Submenus
  { route: '/settings/general', permission: 'settings:general:read', exact: true },
  { route: '/settings/registration', permission: 'settings:registration:read', exact: true },
  { route: '/settings/notification-methods', permission: 'settings:notification-methods:read', exact: true },
  { route: '/settings/smtp-settings', permission: 'settings:smtp-settings:read', exact: true },
  { route: '/settings/custom-fields', permission: 'settings:custom-fields:read', exact: true },
];

/**
 * Get required permission for a route
 * Returns the permission(s) required to access the given pathname
 */
export function getRoutePermission(pathname: string): string[] | null {
  // Find matching route config
  for (const config of routePermissions) {
    let matches = false;
    
    if (typeof config.route === 'string') {
      if (config.exact) {
        matches = config.route === pathname;
      } else {
        matches = pathname === config.route || pathname.startsWith(config.route + '/');
      }
    } else if (config.route instanceof RegExp) {
      matches = config.route.test(pathname);
    }
    
    if (matches) {
      return Array.isArray(config.permission) ? config.permission : [config.permission];
    }
  }
  
  return null;
}

/**
 * Check if a route requires permission check
 */
export function routeRequiresPermission(pathname: string): boolean {
  return getRoutePermission(pathname) !== null;
}

