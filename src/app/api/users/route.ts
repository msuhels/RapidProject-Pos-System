import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/permissions';
import { getUsers, createUser } from '@/core/lib/services/usersService';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { db } from '@/core/lib/db';
import { users, authProviders } from '@/core/lib/db/baseSchema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/users
 * Get all users (with optional filtering)
 * Requires: users:read permission
 * Tenant isolation: Non-super-admin users only see users in their tenant
 */
export async function GET(request: NextRequest) {
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
    
    // Get user's tenant for isolation
    const userTenantId = await getUserTenantId(userId);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const tenantId = searchParams.get('tenantId') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    // Get users with tenant isolation
    const result = await getUsers({
      search,
      tenantId,
      status,
      limit,
      offset,
      currentUserTenantId: userTenantId, // null for super admin, tenant ID for others
    });
    
    // Remove sensitive data
    const sanitizedUsers = result.users.map(({ passwordHash, twoFactorSecret, ...user }) => user);
    
    return NextResponse.json(
      {
        success: true,
        data: sanitizedUsers,
        total: result.total,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Create a new user
 * Requires: users:create permission
 * Tenant isolation: Non-super-admin users can only create users in their tenant
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
    const hasPermission = await userHasPermission(userId, 'users:create');
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions. users:create permission required.' },
        { status: 403 }
      );
    }
    
    // Get user's tenant for isolation
    const userTenantId = await getUserTenantId(userId);
    
    // Parse and validate request body
    const body = await request.json();
    const { validateRequest } = await import('@/core/middleware/validation');
    const { createUserSchema } = await import('@/core/lib/validations/users');
    const validation = validateRequest(createUserSchema, body);
    
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
    
    console.log('[User Create] Request data:', { email: data.email, roleId: data.roleId, tenantId: data.tenantId });
    console.log('[User Create] Creator tenant:', userTenantId);
    
    // Tenant isolation: if user is not super admin, force their tenant
    let targetTenantId = data.tenantId;
    if (userTenantId !== null) {
      // Non-super-admin can only create users in their own tenant
      if (data.tenantId && data.tenantId !== userTenantId) {
        return NextResponse.json(
          { error: 'Forbidden - You can only create users in your own tenant' },
          { status: 403 }
        );
      }
      targetTenantId = userTenantId;
    }
    
    // If no tenant specified and Super Admin is creating, use default tenant
    if (!targetTenantId) {
      console.log('[User Create] No tenant specified, looking for default tenant');
      const { tenants } = await import('@/core/lib/db/baseSchema');
      const defaultTenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, 'default'))
        .limit(1);
      
      if (defaultTenant.length > 0) {
        targetTenantId = defaultTenant[0].id;
        console.log('[User Create] Using default tenant:', targetTenantId);
      } else {
        // Create default tenant if it doesn't exist
        console.log('[User Create] Creating default tenant');
        const newTenant = await db
          .insert(tenants)
          .values({
            name: 'Default Organization',
            slug: 'default',
            status: 'active',
            plan: 'free',
            maxUsers: 1000,
            metadata: {},
          })
          .returning();
        targetTenantId = newTenant[0].id;
        console.log('[User Create] Created default tenant:', targetTenantId);
      }
    }
    
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }
    
    // Ensure we have a tenant (required for role assignment)
    if (!targetTenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required for user creation' },
        { status: 400 }
      );
    }
    
    // Create user (this will auto-assign default role if tenantId is present)
    const user = await createUser(
      {
        ...data,
        tenantId: targetTenantId,
      },
      userId
    );
    
    console.log('[User Create] User created:', user.id, 'with tenant:', user.tenantId);
    
    // Create auth provider entry for password authentication
    await db.insert(authProviders).values({
      userId: user.id,
      provider: 'password',
    });
    
    // If a specific role was requested (and different from default), update it
    if (data.roleId) {
      console.log('[User Create] Specific role requested:', data.roleId);
      const { userRoles } = await import('@/core/lib/db/baseSchema');
      
      // Remove the default role that was auto-assigned
      await db
        .delete(userRoles)
        .where(eq(userRoles.userId, user.id));
      
      console.log('[User Create] Assigning requested role');
      
      // Assign the requested role
      await db.insert(userRoles).values({
        userId: user.id,
        roleId: data.roleId,
        tenantId: targetTenantId,
        grantedBy: userId,
        isActive: true,
        metadata: {},
      });
      
      console.log('[User Create] Role assigned successfully');
    } else {
      console.log('[User Create] No specific role requested, using default role from createUser');
    }
    
    // Return user data (without password hash)
    const { passwordHash, twoFactorSecret, ...userWithoutPassword } = user;
    
    return NextResponse.json(
      {
        success: true,
        data: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
