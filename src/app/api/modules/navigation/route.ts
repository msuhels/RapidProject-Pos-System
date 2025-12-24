import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/core/middleware/auth';
import { getUserRoles, getUserTenantId } from '@/core/lib/permissions';

/**
 * GET /api/modules/navigation
 * Get navigation items for the current user based on their permissions
 * Super Admin sees everything, other users see based on their role permissions
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifyAuth(request);
    if (!userId) {
      console.error('[Navigation API] Authentication failed - no userId returned');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('[Navigation API] Authenticated user:', userId);

    // Get user's roles
    const tenantId = await getUserTenantId(userId);
    const userRoles = await getUserRoles(userId, tenantId || undefined);

    if (userRoles.length === 0) {
      // User has no roles, return empty navigation
      return NextResponse.json({
        success: true,
        navigation: [],
      });
    }

    // Check if user is Super Admin
    const isSuperAdmin = userRoles.some(role => role.code === 'SUPER_ADMIN');

    // Get all active modules from database
    const { db } = await import('@/core/lib/db');
    const { modules } = await import('@/core/lib/db/baseSchema');
    const { eq } = await import('drizzle-orm');

    const allModules = await db
      .select()
      .from(modules)
      .where(eq(modules.isActive, true))
      .orderBy(modules.sortOrder);

    // Build navigation from modules (exclude profile module - it should be accessible to all users for their own profile)
    const navigationItems = allModules
      .filter(module => module.code.toLowerCase() !== 'profile')
      .map(module => {
        const moduleCode = module.code.toLowerCase();
        let path = `/${moduleCode}`;
        
        // Map core modules to their correct paths
        if (moduleCode === 'dashboard') path = '/dashboard';
        else if (moduleCode === 'users') path = '/users';
        else if (moduleCode === 'roles') path = '/roles';
        else if (moduleCode === 'settings') path = '/settings/general';

        return {
          label: module.name,
          path,
          icon: module.icon || 'Box',
          order: module.sortOrder || 999,
        };
      });

    // If Super Admin, return all navigation
    if (isSuperAdmin) {
      return NextResponse.json({
        success: true,
        navigation: navigationItems,
      });
    }

    // For other users, filter based on permissions
    const { getUserPermissions } = await import('@/core/lib/permissions');
    const userPermissions = await getUserPermissions(userId);
    
    console.log('[Navigation API] User permissions:', userPermissions);
    
    // Filter navigation items based on read permissions
    const filteredNavigation = navigationItems.filter(item => {
      // Extract module code from path
      const pathParts = item.path.split('/').filter(Boolean);
      const moduleCode = pathParts[0] || 'dashboard';
      
      // Check if user has read permission for this module
      const readPermission = `${moduleCode}:read`;
      const wildcardPermission = `${moduleCode}:*`;
      
      const hasPermission = userPermissions.includes(readPermission) || 
                           userPermissions.includes(wildcardPermission) ||
                           userPermissions.includes('admin:*');
      
      console.log(`[Navigation API] Module: ${moduleCode}, Permission: ${readPermission}, Has Access: ${hasPermission}`);
      
      return hasPermission;
    });

    return NextResponse.json({
      success: true,
      navigation: filteredNavigation,
    });
  } catch (error) {
    console.error('Failed to get module navigation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load navigation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
