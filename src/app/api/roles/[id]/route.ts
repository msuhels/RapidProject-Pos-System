import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/permissions';
import { getRoleWithUserCount, updateRole, deleteRole, getRoleById } from '@/core/lib/services/rolesService';
import { isUserSuperAdmin } from '@/core/lib/permissions';
import { db } from '@/core/lib/db';
import { Role, roles } from '@/core/lib/db/baseSchema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/roles/:id
 * Get a single role by ID
 * Requires: roles:read permission
 * Note: Super Admin role is only accessible to Super Admin users
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }
    
    const userId = authResult;
    
    // Check permission
    const permissionMiddleware = requirePermission('roles:read');
    const permissionResult = await permissionMiddleware(request);
    
    if (permissionResult instanceof NextResponse) {
      return permissionResult; // Forbidden response
    }
    
    const { id } = await params;
    
    // Get role
    const result = await getRoleWithUserCount(id);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }
    
    // Check if this is Super Admin role and user is not Super Admin
    if (result.role.code === 'SUPER_ADMIN') {
      const isSuperAdmin = await isUserSuperAdmin(userId);
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get role by ID error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/roles/:id
 * Update a role
 * Requires: roles:update permission
 * Note: Super Admin role can only be updated by Super Admin users
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }
    
    const userId = authResult;
    
    // Check permission
    const permissionMiddleware = requirePermission('roles:update');
    const permissionResult = await permissionMiddleware(request);
    
    if (permissionResult instanceof NextResponse) {
      return permissionResult; // Forbidden response
    }
    
    const { id } = await params;
    
    // Check if this is Super Admin role and user is not Super Admin
    const targetRole = await getRoleById(id);
    if (targetRole && targetRole.code === 'SUPER_ADMIN') {
      const isSuperAdmin = await isUserSuperAdmin(userId);
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: 'Forbidden - Only Super Admins can modify the Super Admin role' },
          { status: 403 }
        );
      }
    }
    
    // Parse and validate request body
    const body = await request.json();
    const { validateRequest } = await import('@/core/middleware/validation');
    const { updateRoleSchema } = await import('@/core/lib/validations/roles');
    const validation = validateRequest(updateRoleSchema, body);
    
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
    
    // Check if code is being changed and if it's already taken
    if (data.code) {
      const existingRole = await db
        .select()
        .from(roles)
        .where(eq(roles.code, data.code.toUpperCase()))
        .limit(1);
      
      if (existingRole.length > 0 && existingRole[0].id !== id) {
        return NextResponse.json(
          { error: 'Role code already exists' },
          { status: 409 }
        );
      }
    }
    
    // Update role
    try {
      const role = await updateRole(id, data, userId);
      
      if (!role) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        {
          success: true,
          data: role,
        },
        { status: 200 }
      );
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/roles/:id
 * Delete a role (soft delete)
 * Requires: roles:delete permission
 * Note: Super Admin role can only be deleted by Super Admin users (though it's a system role and cannot be deleted)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }
    
    const userId = authResult;
    
    // Check permission
    const permissionMiddleware = requirePermission('roles:delete');
    const permissionResult = await permissionMiddleware(request);
    
    if (permissionResult instanceof NextResponse) {
      return permissionResult; // Forbidden response
    }
    
    const { id } = await params;
    
    // Check if this is Super Admin role and user is not Super Admin
    const targetRole = await getRoleById(id);
    if (targetRole && targetRole.code === 'SUPER_ADMIN') {
      const isSuperAdmin = await isUserSuperAdmin(userId);
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: 'Forbidden - Only Super Admins can delete the Super Admin role' },
          { status: 403 }
        );
      }
    }
    
    // Delete role
    try {
      const success = await deleteRole(id, userId);
      
      if (!success) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        {
          success: true,
          message: 'Role deleted successfully',
        },
        { status: 200 }
      );
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Delete role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

