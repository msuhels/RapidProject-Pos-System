import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserWithRoles, updateUser, deleteUser } from '@/core/lib/services/usersService';
import { getUserTenantId, userHasPermission, userBelongsToTenant, getUserRoles } from '@/core/lib/permissions';
import { getRoleById } from '@/core/lib/roles';
import { db } from '@/core/lib/db';
import { users } from '@/core/lib/db/baseSchema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * GET /api/users/:id
 * Get a single user by ID
 * Requires: users:read permission
 * Tenant isolation: Non-super-admin users can only view users in their tenant
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
    const hasPermission = await userHasPermission(userId, 'users:read');
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions. users:read permission required.' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    
    // Get user
    const result = await getUserWithRoles(id);
    
    if (!result) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Tenant isolation check
    const userTenantId = await getUserTenantId(userId);
    if (userTenantId !== null && result.user.tenantId !== userTenantId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only view users in your tenant' },
        { status: 403 }
      );
    }
    
    // Remove password hash and sensitive data from response
    const { passwordHash, twoFactorSecret, ...userWithoutPassword } = result.user;
    
    return NextResponse.json(
      {
        success: true,
        data: {
          ...userWithoutPassword,
          roles: result.roles,
          tenant: result.tenant,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user by ID error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/:id
 * Update a user
 * Requires: users:update permission
 * Tenant isolation: Non-super-admin users can only update users in their tenant
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
    const hasPermission = await userHasPermission(userId, 'users:update');
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions. users:update permission required.' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    
    // Get target user
    const targetUser = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);
    
    if (targetUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Tenant isolation check
    const userTenantId = await getUserTenantId(userId);
    if (userTenantId !== null && targetUser[0].tenantId !== userTenantId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only update users in your tenant' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    console.log('[User Update] Request body:', body);
    
    const { validateRequest } = await import('@/core/middleware/validation');
    const { updateUserSchema } = await import('@/core/lib/validations/users');
    const validation = validateRequest(updateUserSchema, body);
    
    if (!validation.success) {
      console.log('[User Update] Validation failed:', validation.error.errors);
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    console.log('[User Update] Validated data:', data);

    // Prevent users from changing their own role
    if (data.roleId !== undefined && id === userId) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 400 }
      );
    }

    // Check if role is being changed and validate SUPER_ADMIN restrictions
    if (data.roleId !== undefined) {
      // Get the role being assigned
      const targetRole = await getRoleById(data.roleId);
      
      if (!targetRole) {
        return NextResponse.json(
          { error: 'Invalid role specified' },
          { status: 400 }
        );
      }

      // Check if trying to assign/remove SUPER_ADMIN role
      const isSuperAdminRole = targetRole.code === 'SUPER_ADMIN';
      
      if (isSuperAdminRole) {
        // Only super admins can assign/remove SUPER_ADMIN role
        const currentUserRoles = await getUserRoles(userId);
        const isCurrentUserSuperAdmin = currentUserRoles.some(r => r.code === 'SUPER_ADMIN');
        
        if (!isCurrentUserSuperAdmin) {
          return NextResponse.json(
            { error: 'Only super admins can assign or remove super admin role' },
            { status: 403 }
          );
        }
      }

      // Check if trying to remove SUPER_ADMIN from a user
      const targetUserWithRoles = await getUserWithRoles(id);
      if (targetUserWithRoles) {
        const targetUserHasSuperAdmin = targetUserWithRoles.roles.some(r => r.code === 'SUPER_ADMIN');
        
        // If target user has SUPER_ADMIN and we're changing to a different role
        if (targetUserHasSuperAdmin && !isSuperAdminRole) {
          // Only super admins can remove SUPER_ADMIN role
          const currentUserRoles = await getUserRoles(userId);
          const isCurrentUserSuperAdmin = currentUserRoles.some(r => r.code === 'SUPER_ADMIN');
          
          if (!isCurrentUserSuperAdmin) {
            return NextResponse.json(
              { error: 'Only super admins can remove super admin role from users' },
              { status: 403 }
            );
          }
        }
      }
    }

    // Check if email is being changed and if it's already taken
    if (data.email) {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);
      
      if (existingUser.length > 0 && existingUser[0].id !== id) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }
    }
    
    // Extract only the fields that updateUser expects
    const updateData: Parameters<typeof updateUser>[1] = {
      ...(data.email !== undefined && { email: data.email }),
      ...(data.fullName !== undefined && { fullName: data.fullName }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.password !== undefined && { password: data.password }),
      ...(data.timezone !== undefined && { timezone: data.timezone }),
      ...(data.locale !== undefined && { locale: data.locale }),
      ...(data.roleId !== undefined && { roleId: data.roleId }),
    };
    
    // Update user
    const user = await updateUser(id, updateData, userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Remove password hash from response
    const { passwordHash, twoFactorSecret, ...userWithoutPassword } = user;
    
    return NextResponse.json(
      {
        success: true,
        data: userWithoutPassword,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/:id
 * Delete a user (soft delete)
 * Requires: users:delete permission
 * Tenant isolation: Non-super-admin users can only delete users in their tenant
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
    const hasPermission = await userHasPermission(userId, 'users:delete');
    
    console.log('[User Delete] Permission check:', { userId, hasPermission });
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions. users:delete permission required.' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    
    console.log('[User Delete] Attempting to delete user:', id, 'by:', userId);
    
    // Prevent self-deletion
    if (id === userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }
    
    // Get target user
    const targetUser = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);
    
    console.log('[User Delete] Target user found:', targetUser.length > 0);
    
    if (targetUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Tenant isolation check
    const userTenantId = await getUserTenantId(userId);
    console.log('[User Delete] Tenant check:', { userTenantId, targetTenantId: targetUser[0].tenantId });
    
    if (userTenantId !== null && targetUser[0].tenantId !== userTenantId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete users in your tenant' },
        { status: 403 }
      );
    }
    
    // Delete user
    const success = await deleteUser(id, userId);
    
    console.log('[User Delete] Delete result:', success);
    
    if (!success) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        message: 'User deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[User Delete] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
