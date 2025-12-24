# RBAC Migration Guide - core.sql Alignment

This guide explains the new RBAC (Role-Based Access Control) system aligned with `core.sql` and how to migrate from the old system.

## 🎯 What Changed

### 1. **Permission Code Format**
- **Old**: `USER_CREATE`, `USER_READ`, `ROLE_UPDATE` (uppercase with underscores)
- **New**: `users:create`, `users:read`, `roles:update` (module:action format)

### 2. **User-Role Relationship**
- **Old**: Single role per user via `users.roleId`
- **New**: Many-to-many relationship via `user_roles` table with temporal access support

### 3. **Permission System**
- **Old**: Simple permission checks
- **New**: 
  - Wildcard support (`users:*` grants all user permissions)
  - Role hierarchy (parent roles inherit permissions)
  - Temporal access (roles can expire)
  - Resource-level permissions (object-specific access)
  - Tenant isolation (multi-tenant support)

### 4. **Schema Changes**
- Added `user_roles` table for many-to-many user-role assignments
- Updated `users` table (removed `roleId`, added security fields)
- Updated `roles` table (added `parentRoleId`, `isDefault`, `color`, etc.)
- Updated `permissions` table (simplified to module:action format)
- Updated `tenants` table (added `slug`, `plan`, `maxUsers`, etc.)
- Added `sessions` table for session management
- Updated `resource_permissions` for object-level access control

## 📦 Database Schema Updates

### Core Tables Structure

```sql
-- Users (no direct roleId)
users:
  - id, tenantId, email, passwordHash, fullName
  - status, isEmailVerified, twoFactorEnabled
  - timezone, locale, lastLoginAt, lastLoginIp
  - failedLoginAttempts, lockedUntil
  - metadata, createdAt, updatedAt, deletedAt

-- Roles (hierarchical, tenant-specific)
roles:
  - id, tenantId, parentRoleId
  - name, code, description
  - isSystem, isDefault, priority, color
  - maxUsers, status, metadata
  - createdAt, updatedAt

-- User Roles (many-to-many with temporal access)
user_roles:
  - id, userId, roleId, tenantId
  - grantedBy, validFrom, validUntil
  - isActive, metadata, assignedAt

-- Permissions (module:action format)
permissions:
  - id, code (e.g., 'users:create')
  - name, module, resource, action
  - description, isDangerous, requiresMfa
  - isActive, metadata, createdAt

-- Role Permissions
role_permissions:
  - id, roleId, permissionId
  - conditions (JSONB for conditional access)
  - grantedAt

-- Resource Permissions (object-level)
resource_permissions:
  - id, userId, tenantId
  - resourceType, resourceId, permissionCode
  - grantedBy, validFrom, validUntil
  - metadata, createdAt

-- Tenants
tenants:
  - id, name, slug
  - settings, status, plan
  - maxUsers, trialEndsAt
  - metadata, createdAt, updatedAt, deletedAt

-- Sessions
sessions:
  - id, userId, tenantId
  - tokenHash, ipAddress, userAgent
  - lastActivity, expiresAt
  - metadata, createdAt
```

## 🚀 Migration Steps

### Step 1: Backup Your Database

```bash
# PostgreSQL backup
pg_dump -U your_user -d your_database > backup_before_rbac_migration.sql
```

### Step 2: Run Drizzle Migration

```bash
# Generate migration
npm run db:generate

# Review the migration file in drizzle/migrations/

# Apply migration
npm run db:push
# or
npm run db:migrate
```

### Step 3: Run the New Seed Script

```bash
# This will populate:
# - Tenants
# - Modules
# - Permissions (with module:action format)
# - Roles (SUPER_ADMIN, TENANT_ADMIN, MANAGER, EDITOR, VIEWER, GUEST)
# - Users (with proper tenant assignments)
# - User-Role assignments
# - Role-Permission mappings

npm run seed
```

### Step 4: Verify the Migration

```bash
# Connect to your database
psql -U your_user -d your_database

# Check permissions
SELECT code, name, module, action FROM permissions ORDER BY module, action;

# Check roles
SELECT code, name, priority, is_system FROM roles ORDER BY priority DESC;

# Check user-role assignments
SELECT 
  u.email, 
  r.code as role_code, 
  t.name as tenant_name,
  ur.is_active,
  ur.valid_until
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
JOIN tenants t ON ur.tenant_id = t.id;
```

## 🔐 Permission System Guide

### Permission Code Format

All permissions follow the `module:action` format:

```
module:action
  ↓      ↓
users:create
```

### Standard Actions

- `create` - Create new resources
- `read` - View/read resources
- `update` - Modify existing resources
- `delete` - Remove resources
- `execute` - Execute operations
- `manage` - High-level management
- `approve` - Approve requests
- `*` - Wildcard (all actions)

### Wildcard Permissions

Wildcards grant all permissions for a module:

- `users:*` → grants `users:create`, `users:read`, `users:update`, `users:delete`, `users:manage`
- `projects:*` → grants all project permissions
- `admin:*` → grants **ALL** permissions (Super Admin only)

### Permission Hierarchy

```
admin:*                    (Super Admin - everything)
  ├─ users:*              (All user permissions)
  │   ├─ users:create
  │   ├─ users:read
  │   ├─ users:update
  │   ├─ users:delete
  │   └─ users:manage
  ├─ roles:*              (All role permissions)
  ├─ projects:*           (All project permissions)
  └─ ...
```

## 👥 Role Structure

### System Roles (Priority Order)

1. **SUPER_ADMIN** (Priority: 100)
   - Permission: `admin:*`
   - No tenant (can access all tenants)
   - Full system access

2. **TENANT_ADMIN** (Priority: 80)
   - Permissions: `users:*`, `roles:*`, `projects:*`, `billing:*`, `audit:read`
   - Tenant-specific
   - Full tenant management

3. **MANAGER** (Priority: 60)
   - Permissions: `users:read`, `users:create`, `users:update`, `roles:read`, `roles:assign`, `projects:*`, `billing:read`
   - Team management

4. **EDITOR** (Priority: 40)
   - Permissions: `users:read`, `projects:create`, `projects:read`, `projects:update`
   - Content editing

5. **VIEWER** (Priority: 20) - **DEFAULT ROLE**
   - Permissions: `users:read`, `projects:read`, `billing:read`
   - Read-only access

6. **GUEST** (Priority: 10)
   - Limited permissions
   - Temporary access

## 🔧 API Usage Examples

### Check User Permission

```typescript
import { userHasPermission } from '@/core/lib/permissions';

// Check specific permission
const canCreate = await userHasPermission(userId, 'users:create');

// Check with tenant context
const canRead = await userHasPermission(userId, 'users:read', tenantId);

// Check resource-level permission
const canEdit = await userHasPermission(
  userId, 
  'projects:update', 
  tenantId,
  'project',
  projectId
);
```

### Get User Permissions

```typescript
import { getUserPermissions } from '@/core/lib/permissions';

// Get all permissions for user
const permissions = await getUserPermissions(userId, tenantId);
// Returns: ['users:read', 'users:create', 'projects:*', ...]
```

### Assign Role to User

```typescript
import { assignRoleToUser } from '@/core/lib/services/usersService';

// Permanent role assignment
await assignRoleToUser(userId, roleId, tenantId, grantedBy);

// Temporary role (expires after 30 days)
const expiryDate = new Date();
expiryDate.setDate(expiryDate.getDate() + 30);
await assignRoleToUser(userId, roleId, tenantId, grantedBy, expiryDate);
```

### API Route Protection

```typescript
import { userHasPermission } from '@/core/lib/permissions';

export async function POST(request: NextRequest) {
  // Get authenticated user
  const userId = await verifyAuth(request);
  
  // Check permission
  const hasPermission = await userHasPermission(userId, 'users:create');
  
  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Forbidden - users:create permission required' },
      { status: 403 }
    );
  }
  
  // ... proceed with operation
}
```

## 🏢 Multi-Tenant Isolation

### Tenant Scoping

All user operations are automatically scoped to the user's tenant:

```typescript
// Non-super-admin users only see users in their tenant
const { users } = await getUsers({
  currentUserTenantId: userTenantId, // null for super admin
});

// Super Admin (tenantId = null) can see all users
// Tenant Admin (tenantId = 'xxx') only sees users in tenant 'xxx'
```

### Tenant Isolation Rules

1. **Super Admin** (`tenantId = null`)
   - Can access all tenants
   - Can create users in any tenant
   - Can assign any role

2. **Tenant Admin** (`tenantId = 'xxx'`)
   - Can only access users in their tenant
   - Can only create users in their tenant
   - Can assign roles within their tenant

3. **Other Roles**
   - Inherit tenant restrictions from Tenant Admin
   - Additional permission restrictions apply

## 📝 Default Login Credentials

After running the seed script:

```
Super Admin:
  Email: admin@example.com
  Password: password123
  Tenant: None (can access all)
  Role: SUPER_ADMIN

Tenant Admin (Acme):
  Email: admin@acme.com
  Password: password123
  Tenant: Acme Corporation
  Role: TENANT_ADMIN

Manager (Acme):
  Email: manager@acme.com
  Password: password123
  Tenant: Acme Corporation
  Role: MANAGER

Viewer (TechStart):
  Email: viewer@techstart.com
  Password: password123
  Tenant: TechStart Inc
  Role: VIEWER
```

## 🎨 Frontend Integration

### Permission-Based UI Rendering

```typescript
'use client';

import { usePermissions } from '@/core/hooks/usePermissions';

export function UserManagement() {
  const { hasPermission } = usePermissions();
  
  return (
    <div>
      {hasPermission('users:read') && (
        <UserList />
      )}
      
      {hasPermission('users:create') && (
        <Button>Create User</Button>
      )}
      
      {hasPermission('users:delete') && (
        <Button variant="destructive">Delete User</Button>
      )}
    </div>
  );
}
```

## 🐛 Troubleshooting

### Issue: Permission checks always return false

**Solution**: Ensure user has role assignments in `user_roles` table:

```sql
SELECT * FROM user_roles WHERE user_id = 'your-user-id' AND is_active = true;
```

### Issue: User can't see any users

**Solution**: Check tenant isolation. Non-super-admin users need matching `tenantId`:

```sql
SELECT id, email, tenant_id FROM users WHERE id = 'your-user-id';
```

### Issue: Wildcard permissions not working

**Solution**: Verify permission checking logic includes wildcard matching:

```typescript
// Should check both exact match and wildcard
const hasPermission = 
  permissions.includes('users:create') || 
  permissions.includes('users:*') ||
  permissions.includes('admin:*');
```

## 📚 Additional Resources

- `core.sql` - Complete PostgreSQL schema with functions
- `src/core/lib/permissions.ts` - Permission checking logic
- `src/core/lib/db/baseSchema.ts` - Drizzle ORM schema
- `scripts/seed.ts` - Seed data with examples

## ✅ Verification Checklist

- [ ] Database backup created
- [ ] Drizzle migration generated and reviewed
- [ ] Migration applied successfully
- [ ] Seed script executed
- [ ] Default users can log in
- [ ] Permission checks working
- [ ] Tenant isolation working
- [ ] API routes protected
- [ ] Frontend UI respects permissions

## 🚨 Important Notes

1. **Breaking Changes**: This is a major schema change. Test thoroughly before deploying to production.

2. **Data Migration**: If you have existing users/roles, you'll need to migrate them to the new `user_roles` structure.

3. **Session Management**: Old sessions may be invalid. Users may need to log in again.

4. **Permission Codes**: Update all hardcoded permission checks from `USER_CREATE` to `users:create` format.

5. **Super Admin**: Ensure at least one Super Admin exists before removing old admin accounts.

## 🎉 Benefits

✅ **Flexible**: Multiple roles per user with temporal access  
✅ **Scalable**: Wildcard permissions reduce permission bloat  
✅ **Secure**: Tenant isolation and resource-level permissions  
✅ **Auditable**: Track who granted permissions and when  
✅ **Hierarchical**: Role inheritance reduces duplication  
✅ **Production-Ready**: Battle-tested patterns from core.sql  

---

**Need Help?** Check the inline documentation in the code or refer to `core.sql` for the complete PostgreSQL implementation.

