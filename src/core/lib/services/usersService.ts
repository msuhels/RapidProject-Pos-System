import { db } from '@/core/lib/db';
import { users, roles, userRoles, tenants } from '@/core/lib/db/baseSchema';
import { eq, and, or, like, isNull, desc, count, sql, lte, gte } from 'drizzle-orm';
import type { User, NewUser } from '@/core/lib/db/baseSchema';
import { hashPassword } from '@/core/lib/utils';

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  tenantId?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
}

export interface UpdateUserInput {
  email?: string;
  fullName?: string | null;
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
  password?: string;
  timezone?: string | null;
  locale?: string | null;
  roleId?: string; // For updating user's role
}

/**
 * Get all users with optional filtering and pagination
 * Supports tenant isolation
 */
export async function getUsers(options?: {
  search?: string;
  tenantId?: string;
  status?: string;
  limit?: number;
  offset?: number;
  currentUserTenantId?: string | null; // For tenant isolation
}): Promise<{ users: Array<User & { roles?: Array<{ id: string; name: string; code: string }> }>; total: number }> {
  const { search, tenantId, status, limit = 100, offset = 0, currentUserTenantId } = options || {};

  // Build where conditions
  const conditions = [];
  
  if (search) {
    conditions.push(
      or(
        like(users.email, `%${search}%`),
        like(users.fullName, `%${search}%`)
      )!
    );
  }
  
  // Tenant isolation: if currentUserTenantId is provided (not null), filter by it
  // If currentUserTenantId is null (Super Admin), show all users
  if (currentUserTenantId !== undefined && currentUserTenantId !== null) {
    conditions.push(eq(users.tenantId, currentUserTenantId));
  }
  
  // Additional tenant filter
  if (tenantId) {
    conditions.push(eq(users.tenantId, tenantId));
  }
  
  if (status) {
    conditions.push(eq(users.status, status));
  }
  
  // Exclude soft-deleted users
  conditions.push(isNull(users.deletedAt));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(users)
    .where(whereClause);
  
  const total = totalResult[0]?.count || 0;

  // Get users
  const usersList = await db
    .select()
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  // Get roles for each user
  const now = new Date();
  const usersWithRoles = await Promise.all(
    usersList.map(async (user) => {
      const userRolesList = await db
        .select({
          id: roles.id,
          name: roles.name,
          code: roles.code,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(
          and(
            eq(userRoles.userId, user.id),
            eq(userRoles.isActive, true),
            or(
              isNull(userRoles.validFrom),
              lte(userRoles.validFrom, now)
            ),
            or(
              isNull(userRoles.validUntil),
              gte(userRoles.validUntil, now)
            ),
            eq(roles.status, 'active')
          )
        );
      
      return {
        ...user,
        roles: userRolesList,
      };
    })
  );

  return {
    users: usersWithRoles,
    total,
  };
}

/**
 * Get a single user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);
  
  if (result.length === 0) {
    return null;
  }
  
  return result[0];
}

/**
 * Get user with roles and tenant information
 */
export async function getUserWithRoles(id: string) {
  const user = await getUserById(id);
  
  if (!user) {
    return null;
  }

  // Get user's roles
  const now = new Date();
  const userRolesList = await db
    .select({
      id: roles.id,
      name: roles.name,
      code: roles.code,
      description: roles.description,
      priority: roles.priority,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(
      and(
        eq(userRoles.userId, id),
        eq(userRoles.isActive, true),
        or(
          isNull(userRoles.validFrom),
          lte(userRoles.validFrom, now)
        ),
        or(
          isNull(userRoles.validUntil),
          gte(userRoles.validUntil, now)
        ),
        eq(roles.status, 'active')
      )
    )
    .orderBy(desc(roles.priority));

  // Get tenant info
  let tenant = null;
  if (user.tenantId) {
    const tenantResult = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, user.tenantId))
      .limit(1);
    
    if (tenantResult.length > 0) {
      tenant = tenantResult[0];
    }
  }

  return {
    user,
    roles: userRolesList,
    tenant,
  };
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserInput, createdBy: string): Promise<User> {
  console.log('[createUser] Creating user:', { email: data.email, tenantId: data.tenantId });
  
  const hashedPassword = await hashPassword(data.password);
  
  const result = await db
    .insert(users)
    .values({
      email: data.email,
      passwordHash: hashedPassword,
      fullName: data.fullName,
      tenantId: data.tenantId || null,
      status: data.status || 'active',
      isEmailVerified: false,
      twoFactorEnabled: false,
      failedLoginAttempts: 0,
      timezone: 'UTC',
      locale: 'en',
      metadata: {},
    })
    .returning();
  
  const newUser = result[0];
  
  console.log('[createUser] User created in DB:', { id: newUser.id, email: newUser.email, tenantId: newUser.tenantId });
  
  // Assign default "USER" role if user has a tenant
  if (newUser.tenantId) {
    console.log('[createUser] User has tenant, looking for default role');
    const { getDefaultUserRole } = await import('@/core/lib/roles');
    const defaultRole = await getDefaultUserRole(newUser.tenantId);
    
    if (defaultRole) {
      console.log('[createUser] Assigning default role:', defaultRole.code, '(', defaultRole.id, ') to user:', newUser.id);
      
      const roleAssignment = await db.insert(userRoles).values({
        userId: newUser.id,
        roleId: defaultRole.id,
        tenantId: newUser.tenantId,
        grantedBy: createdBy,
        isActive: true,
        metadata: {},
      }).returning();
      
      console.log('[createUser] Role assigned successfully:', roleAssignment[0]?.id);
    } else {
      console.warn('[createUser] No default role found for tenant:', newUser.tenantId);
    }
  } else {
    console.warn('[createUser] User has no tenant, skipping role assignment');
  }
  
  return newUser;
}

/**
 * Update a user
 */
export async function updateUser(
  id: string,
  data: UpdateUserInput,
  updatedBy: string
): Promise<User | null> {
  const existing = await getUserById(id);
  if (!existing) {
    return null;
  }
  
  const updateData: Partial<NewUser> = {
    updatedAt: new Date(),
  };
  
  if (data.email !== undefined) {
    updateData.email = data.email;
  }
  
  if (data.fullName !== undefined) {
    updateData.fullName = data.fullName;
  }
  
  if (data.status !== undefined) {
    updateData.status = data.status;
  }
  
  if (data.timezone !== undefined) {
    updateData.timezone = data.timezone;
  }
  
  if (data.locale !== undefined) {
    updateData.locale = data.locale;
  }
  
  if (data.password !== undefined) {
    updateData.passwordHash = await hashPassword(data.password);
  }
  
  const result = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning();
  
  // Update role if provided
  if (data.roleId !== undefined) {
    console.log('[updateUser] Updating role for user:', id, 'to roleId:', data.roleId);
    
    // Get the tenant_id for the role assignment
    // If user has no tenant (e.g., Super Admin), get the tenant from the updater
    let tenantIdForRole = result[0].tenantId;
    
    if (!tenantIdForRole) {
      // Get the updater's tenant
      const updater = await db
        .select({ tenantId: users.tenantId })
        .from(users)
        .where(eq(users.id, updatedBy))
        .limit(1);
      
      tenantIdForRole = updater[0]?.tenantId || null;
      console.log('[updateUser] User has no tenant, using updater tenant:', tenantIdForRole);
    }
    
    // Remove existing roles for this user
    const deletedRoles = await db
      .delete(userRoles)
      .where(eq(userRoles.userId, id))
      .returning();
    
    console.log('[updateUser] Deleted existing roles:', deletedRoles.length);
    
    // Add new role (only if we have a valid tenant_id)
    if (data.roleId && tenantIdForRole) {
      const newUserRole = await db.insert(userRoles).values({
        userId: id,
        roleId: data.roleId,
        tenantId: tenantIdForRole,
        grantedBy: updatedBy,
        isActive: true,
        metadata: {},
      }).returning();
      
      console.log('[updateUser] Created new user role:', newUserRole[0]);
    } else if (data.roleId && !tenantIdForRole) {
      console.error('[updateUser] Cannot assign role: no tenant_id available');
    }
  }
  
  return result[0] || null;
}

/**
 * Delete a user (soft delete)
 */
export async function deleteUser(id: string, deletedBy: string): Promise<boolean> {
  console.log('[deleteUser] Attempting to delete user:', id, 'by:', deletedBy);
  
  const existing = await getUserById(id);
  if (!existing) {
    console.log('[deleteUser] User not found:', id);
    return false;
  }
  
  console.log('[deleteUser] User found, performing soft delete');
  
  // Soft delete
  const result = await db
    .update(users)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();
  
  console.log('[deleteUser] Soft delete completed:', result.length > 0);
  
  return true;
}

/**
 * Assign a role to a user
 */
export async function assignRoleToUser(
  userId: string,
  roleId: string,
  tenantId: string,
  grantedBy: string,
  validUntil?: Date
): Promise<void> {
  await db.insert(userRoles).values({
    userId,
    roleId,
    tenantId,
    grantedBy,
    validFrom: new Date(),
    validUntil: validUntil || null,
    isActive: true,
    metadata: {},
  });
}

/**
 * Remove a role from a user
 */
export async function removeRoleFromUser(
  userId: string,
  roleId: string,
  tenantId: string
): Promise<void> {
  await db
    .update(userRoles)
    .set({ isActive: false })
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, roleId),
        eq(userRoles.tenantId, tenantId)
      )
    );
}

/**
 * Get count of users in a tenant
 */
export async function getUserCountByTenant(tenantId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(users)
    .where(and(eq(users.tenantId, tenantId), isNull(users.deletedAt)));
  
  return result[0]?.count || 0;
}
