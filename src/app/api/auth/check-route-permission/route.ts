import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/core/middleware/auth';
import { userHasPermission, userHasAnyPermission } from '@/core/lib/permissions';
import { getRoutePermission } from '@/core/config/routePermissions';

/**
 * POST /api/auth/check-route-permission
 * Check if the current user has permission to access a route
 * Used by middleware for route protection
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifyAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', hasAccess: false },
        { status: 401 }
      );
    }

    // Get route path from request body
    const body = await request.json();
    const pathname = body.pathname as string;

    if (!pathname) {
      return NextResponse.json(
        { error: 'Pathname is required', hasAccess: false },
        { status: 400 }
      );
    }

    // Get required permission for this route
    const requiredPermissions = getRoutePermission(pathname);

    // If route doesn't require a specific permission, allow access (it's protected by auth only)
    if (!requiredPermissions) {
      return NextResponse.json(
        { hasAccess: true },
        { status: 200 }
      );
    }

    // Check if user has any of the required permissions
    const hasAccess = await userHasAnyPermission(userId, requiredPermissions);

    if (!hasAccess) {
      return NextResponse.json(
        { 
          hasAccess: false,
          error: 'Forbidden - Insufficient permissions',
          requiredPermissions 
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { hasAccess: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Check route permission error:', error);
    return NextResponse.json(
      { error: 'Internal server error', hasAccess: false },
      { status: 500 }
    );
  }
}

