/**
 * Protected Routes Configuration
 * 
 * This file is Edge Runtime compatible and lists all routes that require authentication.
 * Routes are automatically included from module configurations that have requiresAuth: true
 * 
 * IMPORTANT: This file must be manually updated when adding new modules with protected routes,
 * or you can create a build script to auto-generate this from module.config.json files.
 * 
 * Format: Array of route paths that require authentication
 * - Exact paths: '/notes'
 * - Path prefixes: '/notes' will also protect '/notes/new', '/notes/123', etc.
 */

export const protectedRoutes: string[] = [
  // Core protected routes
  '/dashboard',
  '/profile', // Profile (core feature)
  '/users', // User Management (core feature)
  '/roles', // Role Management (core feature)
  '/settings', // Settings area (core feature)
  
  // Module routes with requiresAuth: true
  // Add routes here when modules have requiresAuth: true in their module.config.json
];

/**
 * Check if a pathname matches any protected route
 */
export function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => {
    // Exact match
    if (route === pathname) return true;
    // Path starts with route (e.g., /notes matches /notes/new)
    if (pathname.startsWith(route + '/')) return true;
    // Handle route patterns (e.g., /notes/:id)
    const routePattern = route.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${routePattern}(/.*)?$`);
    return regex.test(pathname);
  });
}