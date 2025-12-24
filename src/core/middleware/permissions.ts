import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from './auth';
import { userHasPermission, userHasAnyPermission, userHasAllPermissions } from '@/core/lib/permissions';

/**
 * Middleware to check if user has a specific permission
 */
export function requirePermission(permissionCode: string) {
  return async (request: NextRequest): Promise<NextResponse | string> => {
    const userId = await verifyAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const hasPermission = await userHasPermission(userId, permissionCode);
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    return userId;
  };
}

/**
 * Middleware to check if user has any of the specified permissions
 */
export function requireAnyPermission(permissionCodes: string[]) {
  return async (request: NextRequest): Promise<NextResponse | string> => {
    const userId = await verifyAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const hasPermission = await userHasAnyPermission(userId, permissionCodes);
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    return userId;
  };
}

/**
 * Middleware to check if user has all of the specified permissions
 */
export function requireAllPermissions(permissionCodes: string[]) {
  return async (request: NextRequest): Promise<NextResponse | string> => {
    const userId = await verifyAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const hasPermission = await userHasAllPermissions(userId, permissionCodes);
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    return userId;
  };
}

