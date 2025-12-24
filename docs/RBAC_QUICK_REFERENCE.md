# RBAC Quick Reference

Quick reference for the new RBAC system aligned with `core.sql`.

## 🔐 Permission Codes (module:action format)

### User Management
```
users:create  - Create users
users:read    - View users
users:update  - Edit users
users:delete  - Delete users
users:manage  - Manage users (bulk operations)
users:*       - All user permissions
```

### Role Management
```
roles:create  - Create roles
roles:read    - View roles
roles:update  - Edit roles
roles:delete  - Delete roles
roles:assign  - Assign roles to users
roles:*       - All role permissions
```

### Project Management
```
projects:create  - Create projects
projects:read    - View projects
projects:update  - Edit projects
projects:delete  - Delete projects
projects:approve - Approve projects
projects:*       - All project permissions
```

### Billing
```
billing:read    - View billing
billing:update  - Update billing
billing:*       - All billing permissions
```

### Audit
```
audit:read  - View audit logs
audit:*     - All audit permissions
```

### System
```
system:*  - System administration
admin:*   - Super Admin (grants EVERYTHING)
```

## 👥 Default Roles

| Role | Priority | Permissions | Use Case |
|------|----------|-------------|----------|
| **SUPER_ADMIN** | 100 | `admin:*` | Full system access, no tenant |
| **TENANT_ADMIN** | 80 | `users:*`, `roles:*`, `projects:*`, `billing:*` | Full tenant management |
| **MANAGER** | 60 | `users:read/create/update`, `projects:*`, `roles:read/assign` | Team management |
| **EDITOR** | 40 | `projects:create/read/update`, `users:read` | Content editing |
| **VIEWER** | 20 | `users:read`, `projects:read`, `billing:read` | Read-only (DEFAULT) |
| **GUEST** | 10 | Limited | Temporary access |

## 💻 Code Examples

### Check Permission

```typescript
import { userHasPermission } from '@/core/lib/permissions';

// Simple check
const canCreate = await userHasPermission(userId, 'users:create');

// With tenant
const canRead = await userHasPermission(userId, 'users:read', tenantId);

// Resource-level
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

const permissions = await getUserPermissions(userId, tenantId);
// Returns: ['users:read', 'projects:*', ...]
```

### Get User Roles

```typescript
import { getUserRoles } from '@/core/lib/permissions';

const roles = await getUserRoles(userId, tenantId);
// Returns: [{ id, name, code, priority }, ...]
```

### Assign Role

```typescript
import { assignRoleToUser } from '@/core/lib/services/usersService';

// Permanent
await assignRoleToUser(userId, roleId, tenantId, grantedBy);

// Temporary (30 days)
const expiry = new Date();
expiry.setDate(expiry.getDate() + 30);
await assignRoleToUser(userId, roleId, tenantId, grantedBy, expiry);
```

### Remove Role

```typescript
import { removeRoleFromUser } from '@/core/lib/services/usersService';

await removeRoleFromUser(userId, roleId, tenantId);
```

### API Route Protection

```typescript
import { userHasPermission } from '@/core/lib/permissions';
import { getUserTenantId } from '@/core/lib/permissions';

export async function POST(request: NextRequest) {
  const userId = await verifyAuth(request);
  
  // Check permission
  if (!await userHasPermission(userId, 'users:create')) {
    return NextResponse.json(
      { error: 'Forbidden - users:create required' },
      { status: 403 }
    );
  }
  
  // Get user's tenant for isolation
  const userTenantId = await getUserTenantId(userId);
  
  // ... your logic with tenant scoping
}
```

### Frontend Permission Check

```typescript
'use client';

import { usePermissions } from '@/core/hooks/usePermissions';

export function MyComponent() {
  const { hasPermission, hasAnyPermission } = usePermissions();
  
  return (
    <>
      {hasPermission('users:create') && (
        <CreateButton />
      )}
      
      {hasAnyPermission(['users:update', 'users:delete']) && (
        <EditButton />
      )}
    </>
  );
}
```

## 🏢 Tenant Isolation

### Rules

| User Type | Tenant Access | Can Create Users In |
|-----------|---------------|---------------------|
| Super Admin (`tenantId = null`) | All tenants | Any tenant |
| Tenant Admin (`tenantId = 'xxx'`) | Own tenant only | Own tenant only |
| Other roles | Own tenant only | Own tenant only (if has permission) |

### Implementation

```typescript
// Get user's tenant
const userTenantId = await getUserTenantId(userId);

// List users with isolation
const { users } = await getUsers({
  currentUserTenantId: userTenantId, // null = see all, 'xxx' = see only tenant xxx
});

// Check tenant access
const canAccess = await userBelongsToTenant(userId, targetTenantId);
```

## 🎯 Wildcard Matching

Wildcards automatically grant all permissions for a module:

```typescript
// User has permission: users:*

await userHasPermission(userId, 'users:create');  // ✅ true
await userHasPermission(userId, 'users:read');    // ✅ true
await userHasPermission(userId, 'users:update');  // ✅ true
await userHasPermission(userId, 'users:delete');  // ✅ true
await userHasPermission(userId, 'users:manage');  // ✅ true

await userHasPermission(userId, 'projects:read'); // ❌ false
```

```typescript
// User has permission: admin:*

await userHasPermission(userId, 'users:create');    // ✅ true
await userHasPermission(userId, 'projects:delete'); // ✅ true
await userHasPermission(userId, 'billing:update');  // ✅ true
// ... everything returns true
```

## 🔄 Role Hierarchy

Roles can inherit from parent roles:

```typescript
// Create child role that inherits from parent
await db.insert(roles).values({
  name: 'Senior Manager',
  code: 'SENIOR_MANAGER',
  parentRoleId: managerRoleId, // Inherits all Manager permissions
  priority: 70,
  // ...
});
```

The permission system automatically includes parent role permissions.

## ⏰ Temporal Access

Roles can have expiration dates:

```typescript
// Grant temporary access
const expiry = new Date('2024-12-31');
await assignRoleToUser(userId, roleId, tenantId, grantedBy, expiry);

// After expiry date, role is automatically inactive
// Permission checks will return false
```

## 🎨 Permission Flags

Permissions can have special flags:

```typescript
{
  code: 'users:delete',
  isDangerous: true,    // Requires extra confirmation in UI
  requiresMfa: true,    // Requires MFA to use
}
```

## 📊 Database Queries

### Check User's Roles

```sql
SELECT 
  u.email,
  r.code as role_code,
  r.name as role_name,
  ur.is_active,
  ur.valid_until
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@example.com'
  AND ur.is_active = true;
```

### Check Role's Permissions

```sql
SELECT 
  r.code as role_code,
  p.code as permission_code,
  p.name as permission_name
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.code = 'MANAGER';
```

### Check User's Effective Permissions

```sql
SELECT DISTINCT p.code, p.name
FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.user_id = 'your-user-id'
  AND ur.is_active = true
  AND (ur.valid_until IS NULL OR ur.valid_until > NOW());
```

## 🔧 Common Tasks

### Create Custom Role

```typescript
import { db } from '@/core/lib/db';
import { roles, rolePermissions, permissions } from '@/core/lib/db/baseSchema';

// 1. Create role
const [newRole] = await db.insert(roles).values({
  name: 'Content Manager',
  code: 'CONTENT_MANAGER',
  tenantId: null, // System role
  isSystem: true,
  priority: 50,
  status: 'active',
}).returning();

// 2. Assign permissions
const permissionCodes = ['projects:*', 'users:read'];
const perms = await db
  .select()
  .from(permissions)
  .where(sql`code = ANY(${permissionCodes})`);

await db.insert(rolePermissions).values(
  perms.map(p => ({
    roleId: newRole.id,
    permissionId: p.id,
  }))
);
```

### Grant Resource-Level Permission

```typescript
import { db } from '@/core/lib/db';
import { resourcePermissions } from '@/core/lib/db/baseSchema';

// Grant user permission to edit specific project
await db.insert(resourcePermissions).values({
  userId: 'user-id',
  tenantId: 'tenant-id',
  resourceType: 'project',
  resourceId: 'project-id',
  permissionCode: 'projects:update',
  grantedBy: 'admin-id',
  validFrom: new Date(),
  validUntil: null, // Permanent
});
```

## 📝 Testing

```typescript
import { userHasPermission, getUserPermissions } from '@/core/lib/permissions';

describe('RBAC', () => {
  it('should grant wildcard permissions', async () => {
    // User with users:*
    expect(await userHasPermission(userId, 'users:create')).toBe(true);
    expect(await userHasPermission(userId, 'users:read')).toBe(true);
  });
  
  it('should enforce tenant isolation', async () => {
    // Tenant admin can't see other tenant's users
    const { users } = await getUsers({
      currentUserTenantId: 'tenant-a',
    });
    
    expect(users.every(u => u.tenantId === 'tenant-a')).toBe(true);
  });
  
  it('should respect temporal access', async () => {
    // Role expires tomorrow
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 1);
    
    await assignRoleToUser(userId, roleId, tenantId, adminId, expiry);
    
    expect(await userHasPermission(userId, 'users:create')).toBe(true);
    
    // After expiry
    // ... (mock date to after expiry)
    expect(await userHasPermission(userId, 'users:create')).toBe(false);
  });
});
```

## 🚀 Quick Start

1. **Run seed script**:
   ```bash
   npm run seed
   ```

2. **Login as Super Admin**:
   ```
   Email: admin@example.com
   Password: password123
   ```

3. **Check permissions in code**:
   ```typescript
   const canCreate = await userHasPermission(userId, 'users:create');
   ```

4. **Protect API routes**:
   ```typescript
   if (!await userHasPermission(userId, 'users:create')) {
     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
   }
   ```

## 📚 See Also

- `RBAC_MIGRATION_GUIDE.md` - Complete migration guide
- `core.sql` - PostgreSQL schema with functions
- `src/core/lib/permissions.ts` - Permission logic
- `src/core/lib/db/baseSchema.ts` - Drizzle schema

---

**Pro Tip**: Use `admin:*` sparingly. It grants ALL permissions. Prefer specific permissions or module wildcards like `users:*` for better security.

