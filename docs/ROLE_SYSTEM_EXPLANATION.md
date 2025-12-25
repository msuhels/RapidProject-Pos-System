# Role System Architecture - How Roles Reference Tables

## Overview
The role system uses a bridge table pattern to connect users with roles, and roles with permissions. This document explains how roles reference the current database tables.

## Core Tables Structure

### 1. **roles** Table
The main roles table that defines all available roles in the system.

```sql
roles
├── id (UUID, Primary Key)
├── tenant_id (UUID, Foreign Key → tenants.id)
├── parent_role_id (UUID, Foreign Key → roles.id) -- For hierarchical roles
├── name (VARCHAR) -- e.g., "Super Admin"
├── code (VARCHAR) -- e.g., "SUPER_ADMIN" (unique per tenant)
├── description (TEXT)
├── is_system (BOOLEAN) -- System roles vs custom roles
├── is_default (BOOLEAN) -- Auto-assign to new users
├── priority (INTEGER) -- 0-100, higher = more important
├── color (VARCHAR) -- Hex color for UI
├── max_users (INTEGER) -- Optional limit
├── status (VARCHAR) -- 'active', 'inactive', 'deprecated'
└── metadata (JSONB) -- Additional data
```

**Key Points:**
- `tenant_id` can be NULL for system-wide roles (like SUPER_ADMIN)
- `parent_role_id` allows role inheritance (child roles inherit parent permissions)
- `code` must be unique per tenant (enforced by unique constraint)

### 2. **user_roles** Table (Bridge Table)
This is the **bridge table** that connects users to roles. It's a many-to-many relationship.

```sql
user_roles
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key → users.id)
├── role_id (UUID, Foreign Key → roles.id)
├── tenant_id (UUID, Foreign Key → tenants.id)
├── granted_by (UUID, Foreign Key → users.id) -- Who assigned this role
├── valid_from (TIMESTAMP) -- When role becomes active
├── valid_until (TIMESTAMP) -- When role expires (NULL = never expires)
├── is_active (BOOLEAN) -- Can be temporarily disabled
├── metadata (JSONB)
└── assigned_at (TIMESTAMP)
```

**Key Points:**
- **Bridge Pattern**: Links `users` ↔ `roles` (many-to-many)
- **Temporal Access**: Supports time-based role assignments
- **Tenant Isolation**: Each assignment is tenant-specific
- **Unique Constraint**: `(user_id, role_id, tenant_id)` ensures no duplicates

### 3. **permissions** Table
Defines atomic permissions in the system.

```sql
permissions
├── id (UUID, Primary Key)
├── code (VARCHAR, UNIQUE) -- Format: "module:action" (e.g., "users:create")
├── name (VARCHAR) -- Display name
├── module (VARCHAR) -- Module name (e.g., "users", "orders")
├── resource (VARCHAR) -- Resource type (optional)
├── action (VARCHAR) -- Action type (create, read, update, delete, etc.)
├── description (TEXT)
├── is_dangerous (BOOLEAN) -- Requires extra confirmation
├── requires_mfa (BOOLEAN) -- Requires MFA
├── is_active (BOOLEAN)
└── metadata (JSONB)
```

### 4. **role_permissions** Table (Bridge Table)
Connects roles to permissions (many-to-many).

```sql
role_permissions
├── id (UUID, Primary Key)
├── role_id (UUID, Foreign Key → roles.id)
├── permission_id (UUID, Foreign Key → permissions.id)
├── conditions (JSONB) -- Optional conditions for permission
└── granted_at (TIMESTAMP)
```

## How Roles Reference Current Tables

### Relationship Diagram

```
users
  │
  │ (many-to-many via user_roles)
  │
  ├─→ user_roles (bridge table)
  │     │
  │     ├─→ role_id → roles
  │     │              │
  │     │              │ (many-to-many via role_permissions)
  │     │              │
  │     │              └─→ role_permissions → permissions
  │     │
  │     └─→ tenant_id → tenants
  │
  └─→ tenant_id → tenants
```

### Example: Checking if User is Super Admin

```typescript
// Step 1: Query user_roles bridge table
const userRoles = await db
  .select({
    roleId: roles.id,
    roleCode: roles.code,
  })
  .from(userRoles)           // Start from bridge table
  .innerJoin(roles, eq(userRoles.roleId, roles.id))  // Join to roles table
  .where(
    and(
      eq(userRoles.userId, userId),      // Filter by user
      eq(userRoles.isActive, true),      // Only active assignments
      eq(roles.status, 'active')         // Only active roles
    )
  );

// Step 2: Check if any role has code 'SUPER_ADMIN'
const isSuperAdmin = userRoles.some(r => r.roleCode === 'SUPER_ADMIN');
```

### How to Get User's Roles

```typescript
// Query flow:
// 1. Start from user_roles (bridge table)
// 2. Join with roles table to get role details
// 3. Filter by user_id and active status

const userRolesList = await db
  .select({
    id: roles.id,
    name: roles.name,
    code: roles.code,
    priority: roles.priority,
  })
  .from(userRoles)                    // Bridge table
  .innerJoin(roles, eq(userRoles.roleId, roles.id))  // Join to roles
  .where(
    and(
      eq(userRoles.userId, userId),
      eq(userRoles.isActive, true),
      eq(roles.status, 'active')
    )
  );
```

### How to Get Role's Permissions

```typescript
// Query flow:
// 1. Start from role_permissions (bridge table)
// 2. Join with permissions table to get permission details
// 3. Filter by role_id

const rolePerms = await db
  .select({
    code: permissions.code,
    name: permissions.name,
  })
  .from(rolePermissions)              // Bridge table
  .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
  .where(
    and(
      eq(rolePermissions.roleId, roleId),
      eq(permissions.isActive, true)
    )
  );
```

## Key Concepts

### 1. Bridge Tables
- **user_roles**: Connects users ↔ roles (many-to-many)
- **role_permissions**: Connects roles ↔ permissions (many-to-many)

### 2. Foreign Key References
- `user_roles.user_id` → `users.id`
- `user_roles.role_id` → `roles.id`
- `user_roles.tenant_id` → `tenants.id`
- `roles.parent_role_id` → `roles.id` (self-reference for hierarchy)
- `role_permissions.role_id` → `roles.id`
- `role_permissions.permission_id` → `permissions.id`

### 3. Unique Constraints
- `roles`: `(tenant_id, code)` - Role code unique per tenant
- `user_roles`: `(user_id, role_id, tenant_id)` - One role assignment per user/tenant
- `role_permissions`: `(role_id, permission_id)` - One permission per role

### 4. Temporal Access
- `user_roles.valid_from` - When role becomes active
- `user_roles.valid_until` - When role expires (NULL = permanent)

## Practical Usage Examples

### Example 1: Check if User Has Role
```typescript
// Check if user has SUPER_ADMIN role
const hasSuperAdmin = await db
  .select()
  .from(userRoles)
  .innerJoin(roles, eq(userRoles.roleId, roles.id))
  .where(
    and(
      eq(userRoles.userId, userId),
      eq(roles.code, 'SUPER_ADMIN'),
      eq(userRoles.isActive, true),
      eq(roles.status, 'active')
    )
  )
  .limit(1);

return hasSuperAdmin.length > 0;
```

### Example 2: Assign Role to User
```typescript
// Insert into bridge table
await db.insert(userRoles).values({
  userId: userId,
  roleId: roleId,
  tenantId: tenantId,
  grantedBy: currentUserId,
  isActive: true,
  validFrom: new Date(),
  // validUntil: null means never expires
});
```

### Example 3: Get All Users with a Role
```typescript
// Get all users who have SUPER_ADMIN role
const superAdmins = await db
  .select({
    userId: users.id,
    userName: users.fullName,
    userEmail: users.email,
  })
  .from(userRoles)
  .innerJoin(roles, eq(userRoles.roleId, roles.id))
  .innerJoin(users, eq(userRoles.userId, users.id))
  .where(
    and(
      eq(roles.code, 'SUPER_ADMIN'),
      eq(userRoles.isActive, true),
      eq(roles.status, 'active')
    )
  );
```

## Summary

1. **roles** table stores role definitions
2. **user_roles** bridge table connects users to roles (many-to-many)
3. **permissions** table stores permission definitions
4. **role_permissions** bridge table connects roles to permissions (many-to-many)
5. To check a user's role, query `user_roles` joined with `roles`
6. To check a role's permissions, query `role_permissions` joined with `permissions`
7. The bridge tables enable flexible many-to-many relationships with additional metadata (temporal access, tenant isolation, etc.)

