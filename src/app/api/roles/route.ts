import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/permissions';
import { getRoles, getRoleUserCount } from '@/core/lib/services/rolesService';
import { isUserSuperAdmin } from '@/core/lib/permissions';

/**
 * GET /api/roles
 * Get all roles (with optional filtering)
 * Requires: roles:read permission
 * Note: Super Admin role is only visible to Super Admin users
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }
    
    const userId = authResult; // userId is returned from requireAuth
    
    // Check permission
    const permissionMiddleware = requirePermission('roles:read');
    const permissionResult = await permissionMiddleware(request);
    
    if (permissionResult instanceof NextResponse) {
      return permissionResult; // Forbidden response
    }
    
    // Check if user is Super Admin
    const isSuperAdmin = await isUserSuperAdmin(userId);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    // Get roles - exclude Super Admin role if user is not Super Admin
    const result = await getRoles({
      search,
      status,
      limit,
      offset,
      excludeSuperAdmin: !isSuperAdmin,
    });
    
    // Get user counts for each role
    const rolesWithCounts = await Promise.all(
      result.roles.map(async (role) => {
        const userCount = await getRoleUserCount(role.id);
        return {
          ...role,
          userCount,
        };
      })
    );
    
    return NextResponse.json(
      {
        success: true,
        data: rolesWithCounts,
        total: result.total,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('List roles error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/roles
 * Create a new role
 * Requires: roles:create permission
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }
    
    const userId = authResult;
    
    // Check permission
    const permissionMiddleware = requirePermission('roles:create');
    const permissionResult = await permissionMiddleware(request);
    
    if (permissionResult instanceof NextResponse) {
      return permissionResult; // Forbidden response
    }
    
    // Parse and validate request body
    const body = await request.json();
    const { validateRequest } = await import('@/core/middleware/validation');
    const { createRoleSchema } = await import('@/core/lib/validations/roles');
    const validation = validateRequest(createRoleSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // Check if role code already exists
    const { db } = await import('@/core/lib/db');
    const { roles } = await import('@/core/lib/db/baseSchema');
    const { eq } = await import('drizzle-orm');
    
    const existingRole = await db
      .select()
      .from(roles)
      .where(eq(roles.code, data.code.toUpperCase()))
      .limit(1);
    
    if (existingRole.length > 0) {
      return NextResponse.json(
        { error: 'Role code already exists' },
        { status: 409 }
      );
    }
    
    // Create role
    const { createRole } = await import('@/core/lib/services/rolesService');
    const role = await createRole(data, userId);
    
    return NextResponse.json(
      {
        success: true,
        data: role,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

