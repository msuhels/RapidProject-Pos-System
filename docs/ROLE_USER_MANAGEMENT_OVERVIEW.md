# Role and User Management Overview

## Introduction

This document provides a high-level overview of the Role and User Management system, explaining how these two core features work together and their relationship to the overall application architecture.

## System Architecture

### Core vs Module Features

Both User Management and Role Management are **core features** of the application, not modules. This means:

- They are always available (not optional)
- They are part of the main application structure
- They appear in the sidebar as static navigation items
- They use standard Next.js routing (not dynamic module routing)

### Location in Codebase

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── users/          # User Management pages
│   │   └── roles/          # Role Management pages
│   └── api/
│       ├── users/          # User Management API
│       └── roles/          # Role Management API
└── core/
    ├── components/
    │   ├── users/          # User Management components
    │   └── roles/          # Role Management components
    ├── lib/
    │   ├── services/
    │   │   ├── usersService.ts
    │   │   ├── rolesService.ts
    │   │   └── rolePermissionsService.ts
    │   └── validations/
    │       ├── users.ts
    │       └── roles.ts
    └── lib/db/
        ├── baseSchema.ts        # Core tables (users, roles)
        └── permissionSchema.ts # Permission tables
```

## Relationship Between Users and Roles

### User-Role Relationship

```
Users Table
    ↓ (roleId)
Roles Table
    ↓ (permissions)
Role Permissions
    ↓ (moduleId)
Modules
```

### How It Works

1. **Users** are assigned a **Role** via `users.roleId`
2. **Roles** have **Permissions** configured at multiple levels:
   - Module-level access
   - Data access level (none, own, team, all)
   - Granular permissions (view, edit, delete, create)
   - Field-level permissions (visibility, editability)
3. **Permissions** are organized by **Modules**
4. Users inherit all permissions from their assigned role

### Permission Inheritance Flow

```
User logs in
    ↓
System checks user's roleId
    ↓
System loads role permissions from:
  - role_module_access (module access + data level)
  - role_module_permissions (granular permissions)
  - role_field_permissions (field permissions)
    ↓
User has access based on role permissions
    ↓
SUPER_ADMIN bypasses all checks
```

## Key Concepts

### 1. Roles

**Purpose**: Group users with similar access needs

**Characteristics**:
- Can be system roles (predefined, cannot be deleted)
- Can be custom roles (created by admins)
- Have a priority for conflict resolution
- Can be active or inactive

**Common Roles**:
- SUPER_ADMIN: Full access, bypasses all checks
- ADMIN: Administrative access
- VIEWER: Read-only access
- Custom roles: Created as needed

### 2. Users

**Purpose**: Individual user accounts

**Characteristics**:
- Must have an email (unique)
- Can have a role assigned
- Have a status (active, inactive, suspended)
- Support soft deletion

**User States**:
- Active: Can log in and use system
- Inactive: Cannot log in
- Suspended: Temporarily disabled
- Deleted: Soft-deleted (deletedAt set)

### 3. Permissions

**Purpose**: Control what users can do

**Levels**:
1. **Module Access**: Can user access the module?
2. **Data Access**: What data can user see? (none, own, team, all)
3. **Granular Permissions**: What actions can user perform? (view, edit, delete, create)
4. **Field Permissions**: Which fields are visible/editable?

## Permission System Architecture

### Permission Tables Structure

```
modules
    ↓
    ├── role_module_access (hasAccess, dataAccess)
    ├── role_module_permissions (granular permissions)
    ├── module_fields (field definitions)
    └── role_field_permissions (field visibility/editability)
```

### Permission Check Flow

```
User requests action
    ↓
Check if user is SUPER_ADMIN
    ↓ (if not)
Check role_module_access.hasAccess
    ↓ (if true)
Check role_module_access.dataAccess
    ↓
Check role_module_permissions for specific action
    ↓
Check role_field_permissions for field access
    ↓
Grant or deny access
```

## Common Workflows

### Workflow 1: Creating a New User

1. Admin navigates to User Management
2. Clicks "Add User"
3. Fills form (email, name, password, role, status)
4. System validates input
5. System creates user and auth_provider entry
6. User appears in list
7. User can log in with assigned role's permissions

### Workflow 2: Creating a New Role

1. Admin navigates to Role Management
2. Clicks "Create New Role"
3. Fills form (name, code, description, priority, status)
4. System validates and creates role
5. Role appears in list (no permissions yet)
6. Admin expands role and configures permissions per module

### Workflow 3: Configuring Role Permissions

1. Admin navigates to Role Management
2. Expands a role to see modules
3. Clicks "Configure" on a module card
4. Permission Assignment page opens
5. Admin configures:
   - Enable/disable module access
   - Set data access level
   - Grant/deny granular permissions
   - Set field visibility/editability
6. Clicks "Save Changes"
7. Permissions are saved
8. All users with this role inherit new permissions

### Workflow 4: User Permission Check

1. User logs in
2. System loads user's role
3. System loads role's permissions
4. User navigates to a page
5. System checks:
   - Is module access enabled?
   - What data access level?
   - Does user have required permission?
   - Are required fields visible?
6. System grants or denies access

## API Endpoint Summary

### User Management Endpoints

- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Role Management Endpoints

- `GET /api/roles` - List roles
- `POST /api/roles` - Create role
- `GET /api/roles/:id` - Get role
- `PATCH /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role

### Permission Management Endpoints

- `GET /api/roles/:id/permissions` - Get all role permissions
- `GET /api/roles/:id/permissions/:moduleId` - Get role/module permissions
- `PATCH /api/roles/:id/permissions/:moduleId` - Update role/module permissions

## Security Model

### Authentication
- All operations require authentication
- Uses JWT tokens stored in HTTP-only cookies
- Tokens validated on every request

### Authorization
- Permission-based access control
- SUPER_ADMIN bypasses all checks
- All other roles checked against permissions
- API endpoints use `requirePermission` middleware

### Data Protection
- Passwords hashed with bcrypt
- Soft deletes (data not permanently removed)
- Input validation with Zod schemas
- SQL injection protection via Drizzle ORM

## Best Practices

### Role Management
1. **Create roles based on job functions**, not individual users
2. **Use descriptive role names** (e.g., "Project Manager" not "PM")
3. **Set appropriate priorities** for conflict resolution
4. **Document role purposes** in description field
5. **Test permissions** after configuration

### User Management
1. **Assign roles, not individual permissions** to users
2. **Use strong passwords** (enforced by validation)
3. **Set appropriate status** (active, inactive, suspended)
4. **Soft delete** instead of hard delete
5. **Monitor user counts** per role

### Permission Configuration
1. **Start with module access** - enable/disable modules
2. **Set data access level** - determine data scope
3. **Grant granular permissions** - specific actions
4. **Configure field permissions** - fine-grained control
5. **Test thoroughly** before deploying

## Troubleshooting

### User Cannot Access Feature
1. Check user's role assignment
2. Check role's module access (hasAccess)
3. Check data access level
4. Check granular permissions
5. Check field permissions (if applicable)

### Permission Changes Not Taking Effect
1. Verify permissions were saved
2. Check if user's role was updated
3. User may need to log out and log back in
4. Check browser cache

### Role Cannot Be Deleted
1. Check if role is system role (isSystem = true)
2. Check if role has users assigned
3. System roles and roles with users cannot be deleted

## Migration and Setup

### Initial Setup
1. Run core.sql to create base tables
2. Run migrations/add_role_permissions_tables.sql for permission tables
3. Seed initial roles (SUPER_ADMIN, ADMIN, VIEWER)
4. Create first SUPER_ADMIN user

### Adding New Modules
1. Insert module into `modules` table
2. Create permissions for module in `permissions` table
3. Create fields for module in `module_fields` table
4. Configure role permissions via UI

### Adding New Fields to Module
1. Insert field into `module_fields` table
2. Field automatically appears in Permission Assignment
3. Configure field permissions per role

## Related Documentation

- [User Management Flow](./USER_MANAGEMENT_FLOW.md) - Detailed user management flow
- [Role Management Flow](./ROLE_MANAGEMENT_FLOW.md) - Detailed role management flow
- [Permission System](./PERMISSION_SYSTEM.md) - Permission system architecture (if exists)

## Summary

The Role and User Management system provides a comprehensive, flexible permission management solution with:

- **User Management**: Create, update, delete users with role assignment
- **Role Management**: Create, update, delete roles with comprehensive permission configuration
- **Permission Management**: Four-level permission system (module, data, granular, field)
- **Security**: Authentication, authorization, and data protection
- **Flexibility**: Dynamic fields and permissions per module
- **Scalability**: Supports multiple modules and complex permission scenarios

Both systems work together to provide fine-grained access control while maintaining simplicity and usability.

