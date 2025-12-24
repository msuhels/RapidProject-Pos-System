# Role Management Flow Documentation

## Overview
Role Management is a core feature that allows administrators to create, update, delete roles, and configure comprehensive permissions at module, data, and field levels. It's implemented as a standard Next.js application feature (not a module) and provides flexible permission management.

## Architecture Overview

### Directory Structure
```
src/
├── app/
│   ├── (dashboard)/
│   │   └── roles/
│   │       └── page.tsx              # Main Role Management page
│   └── api/
│       └── roles/
│           ├── route.ts              # GET (list), POST (create) /api/roles
│           └── [id]/
│               ├── route.ts          # GET, PATCH, DELETE /api/roles/:id
│               └── permissions/
│                   ├── route.ts      # GET /api/roles/:id/permissions
│                   └── [moduleId]/
│                       └── route.ts  # GET, PATCH /api/roles/:id/permissions/:moduleId
├── core/
│   ├── components/
│   │   └── roles/
│   │       ├── RoleList.tsx          # Component that fetches and displays roles
│   │       ├── ExpandableRoleTable.tsx # Table with expandable rows
│   │       ├── RoleTable.tsx         # Basic table component (legacy)
│   │       ├── RoleForm.tsx          # Form for creating/editing roles
│   │       └── PermissionAssignment.tsx # Permission configuration page
│   ├── lib/
│   │   ├── services/
│   │   │   ├── rolesService.ts       # Business logic for role operations
│   │   │   └── rolePermissionsService.ts # Permission management logic
│   │   ├── validations/
│   │   │   └── roles.ts              # Zod schemas for role validation
│   │   └── db/
│   │       ├── baseSchema.ts         # Core database schemas
│   │       └── permissionSchema.ts   # Permission-related schemas
│   └── store/
│       └── authStore.ts             # Zustand store for authentication
```

## Flow Diagrams

### 1. Role List Flow

```
User navigates to /roles
    ↓
src/app/(dashboard)/roles/page.tsx
    ↓
Checks authentication (useAuthStore)
    ↓
Renders RoleList component
    ↓
src/core/components/roles/RoleList.tsx
    ↓
Fetches roles from /api/roles
    ↓
src/app/api/roles/route.ts (GET)
    ↓
Checks authentication & permissions
    ↓
Calls rolesService.getRoles()
    ↓
src/core/lib/services/rolesService.ts
    ↓
Queries database (Drizzle ORM)
    ↓
Gets user count for each role
    ↓
Returns roles with user counts
    ↓
Renders ExpandableRoleTable
    ↓
src/core/components/roles/ExpandableRoleTable.tsx
    ↓
Displays roles in expandable table
```

### 2. Expand Role to View Permissions Flow

```
User clicks expand arrow on role row
    ↓
src/core/components/roles/ExpandableRoleTable.tsx
    ↓
Sets role as expanded in state
    ↓
Checks if permissions already loaded
    ↓
If not loaded, fetches from /api/roles/:id/permissions
    ↓
src/app/api/roles/[id]/permissions/route.ts (GET)
    ↓
Calls rolePermissionsService.getRolePermissions()
    ↓
src/core/lib/services/rolePermissionsService.ts
    ↓
Fetches:
  - All modules
  - Role module access
  - Role module permissions
  - Module fields
  - Role field permissions
    ↓
Organizes data by module
    ↓
Returns structured permission data
    ↓
Component displays permission cards
    ↓
Each card shows:
  - Module name
  - Access status
  - Data access level
  - Granted permissions (as badges)
  - Configure button
```

### 3. Configure Permissions Flow

```
User clicks "Configure" on a module card
    ↓
src/core/components/roles/ExpandableRoleTable.tsx
    ↓
Calls onConfigurePermissions(roleId, moduleId)
    ↓
src/app/(dashboard)/roles/page.tsx
    ↓
Fetches role and module details
    ↓
Sets showPermissionAssignment = true
    ↓
Renders PermissionAssignment component
    ↓
src/core/components/roles/PermissionAssignment.tsx
    ↓
Fetches current permissions from /api/roles/:id/permissions/:moduleId
    ↓
src/app/api/roles/[id]/permissions/[moduleId]/route.ts (GET)
    ↓
Returns:
  - Current role module permissions
  - Available permissions for module
  - Available fields for module
    ↓
Component displays three sections:
  1. Module Permissions (Enable Access + granular)
  2. Data Permission (None, Own, Team, All)
  3. Field Level Permission (visibility/editability)
    ↓
User configures and clicks "Save Changes"
    ↓
PATCH /api/roles/:id/permissions/:moduleId
    ↓
src/app/api/roles/[id]/permissions/[moduleId]/route.ts (PATCH)
    ↓
Validates request body
    ↓
Calls rolePermissionsService.updateRoleModulePermissions()
    ↓
src/core/lib/services/rolePermissionsService.ts
    ↓
Updates:
  - role_module_access table
  - role_module_permissions table
  - role_field_permissions table
    ↓
Returns success
    ↓
Component navigates back to role list
    ↓
Role list refreshes to show updated permissions
```

### 4. Create Role Flow

```
User clicks "Create New Role" button
    ↓
src/app/(dashboard)/roles/page.tsx
    ↓
Sets showForm = true
    ↓
Renders RoleForm component
    ↓
src/core/components/roles/RoleForm.tsx
    ↓
User fills form and submits
    ↓
Validates with Zod schema
    ↓
src/core/lib/validations/roles.ts
    ↓
Calls handleCreate in page.tsx
    ↓
POST /api/roles
    ↓
src/app/api/roles/route.ts (POST)
    ↓
Validates request body
    ↓
Checks authentication & permissions (roles:create)
    ↓
Checks if role code already exists
    ↓
Calls rolesService.createRole()
    ↓
src/core/lib/services/rolesService.ts
    ↓
Inserts role into database
    ↓
Returns created role
    ↓
Page refreshes role list (refreshTrigger++)
```

### 5. Edit Role Flow

```
User clicks "Edit" button on a role row
    ↓
src/core/components/roles/ExpandableRoleTable.tsx
    ↓
Calls onEditClick(role)
    ↓
src/app/(dashboard)/roles/page.tsx
    ↓
Sets editingRole = role, showForm = true
    ↓
Renders RoleForm with initialData
    ↓
User modifies and submits
    ↓
PATCH /api/roles/:id
    ↓
src/app/api/roles/[id]/route.ts (PATCH)
    ↓
Validates request body
    ↓
Prevents modifying system role code/isSystem
    ↓
Calls rolesService.updateRole()
    ↓
Updates role in database
    ↓
Returns updated role
    ↓
Page refreshes role list
```

### 6. Delete Role Flow

```
User clicks "Delete" button on a role row
    ↓
src/core/components/roles/ExpandableRoleTable.tsx
    ↓
Calls onDeleteClick(role)
    ↓
src/core/components/roles/RoleList.tsx
    ↓
Shows confirmation dialog
    ↓
DELETE /api/roles/:id
    ↓
src/app/api/roles/[id]/route.ts (DELETE)
    ↓
Checks authentication & permissions (roles:delete)
    ↓
Prevents deleting system roles
    ↓
Checks if role has users assigned
    ↓
Calls rolesService.deleteRole()
    ↓
Soft deletes role (sets deletedAt)
    ↓
Returns success
    ↓
RoleList refetches roles
```

## Key Components

### 1. Page Component (`src/app/(dashboard)/roles/page.tsx`)
- **Purpose**: Main container for Role Management
- **Responsibilities**:
  - Authentication check
  - State management (form, permissions view)
  - Form submission handling
  - Permission configuration navigation
- **Key State**:
  - `showForm`: Controls form visibility
  - `editingRole`: Currently editing role
  - `showPermissionAssignment`: Controls permission view
  - `selectedRole`: Role being configured
  - `selectedModule`: Module being configured
  - `refreshTrigger`: Triggers list refresh

### 2. RoleList Component (`src/core/components/roles/RoleList.tsx`)
- **Purpose**: Fetches and manages role data
- **Responsibilities**:
  - Fetching roles from API
  - Handling delete operations
  - Passing data to ExpandableRoleTable
- **Props**:
  - `onCreateClick`: Callback to show create form
  - `onEditClick`: Callback to show edit form
  - `onConfigurePermissions`: Callback to configure permissions
  - `refreshTrigger`: Number that triggers refetch

### 3. ExpandableRoleTable Component (`src/core/components/roles/ExpandableRoleTable.tsx`)
- **Purpose**: Displays roles with expandable permission cards
- **Responsibilities**:
  - Rendering role data
  - Managing expanded state
  - Loading permissions on expand
  - Displaying permission cards
- **Features**:
  - Expandable rows
  - Permission cards per module
  - Data access badges
  - Permission badges
  - Configure buttons

### 4. PermissionAssignment Component (`src/core/components/roles/PermissionAssignment.tsx`)
- **Purpose**: Comprehensive permission configuration interface
- **Responsibilities**:
  - Loading current permissions
  - Displaying three permission sections
  - Handling permission updates
  - Saving changes
- **Sections**:
  1. **Module Permissions**:
     - Enable Access checkbox
     - Granular permissions (View, Edit, Delete, Create, etc.)
  2. **Data Permission**:
     - Radio buttons: None, Own, Team, All
  3. **Field Level Permission**:
     - Table with field visibility and editability

### 5. RoleForm Component (`src/core/components/roles/RoleForm.tsx`)
- **Purpose**: Form for creating/editing roles
- **Fields**:
  - Name (required)
  - Code (required, uppercase, disabled for system roles)
  - Description (optional)
  - Priority (number, for create only)
  - Status (active/inactive)

## API Endpoints

### Role Management

#### GET /api/roles
- **Purpose**: List all roles with user counts
- **Query Parameters**: `search`, `status`, `limit`, `offset`
- **Authentication**: Required
- **Permission**: `roles:read`
- **Response**: `{ success: true, data: Role[], total: number }`

#### POST /api/roles
- **Purpose**: Create a new role
- **Request Body**: `{ name, code, description?, priority?, status? }`
- **Authentication**: Required
- **Permission**: `roles:create`
- **Response**: `{ success: true, data: Role }`

#### GET /api/roles/:id
- **Purpose**: Get a single role by ID
- **Authentication**: Required
- **Permission**: `roles:read`
- **Response**: `{ success: true, data: Role }`

#### PATCH /api/roles/:id
- **Purpose**: Update a role
- **Request Body**: `{ name?, code?, description?, priority?, status? }`
- **Authentication**: Required
- **Permission**: `roles:update`
- **Response**: `{ success: true, data: Role }`
- **Note**: Cannot modify system role code or isSystem flag

#### DELETE /api/roles/:id
- **Purpose**: Delete a role (soft delete)
- **Authentication**: Required
- **Permission**: `roles:delete`
- **Response**: `{ success: true, message: string }`
- **Note**: Cannot delete system roles or roles with assigned users

### Permission Management

#### GET /api/roles/:id/permissions
- **Purpose**: Get all permissions for a role, organized by module
- **Authentication**: Required
- **Permission**: `roles:read`
- **Response**: `{ success: true, data: { roleId, modules: ModulePermission[] } }`

#### GET /api/roles/:id/permissions/:moduleId
- **Purpose**: Get permissions for a specific role and module
- **Authentication**: Required
- **Permission**: `roles:read`
- **Response**: `{ success: true, data: { roleModulePermissions, availablePermissions, availableFields } }`

#### PATCH /api/roles/:id/permissions/:moduleId
- **Purpose**: Update permissions for a role and module
- **Request Body**: 
  ```json
  {
    "hasAccess": boolean,
    "dataAccess": "none" | "own" | "team" | "all",
    "permissions": [{ "permissionId": string, "granted": boolean }],
    "fields": [{ "fieldId": string, "isVisible": boolean, "isEditable": boolean }]
  }
  ```
- **Authentication**: Required
- **Permission**: `roles:update`
- **Response**: `{ success: true, message: string }`

## Service Layer

### rolesService.ts (`src/core/lib/services/rolesService.ts`)
- **Purpose**: Business logic for role operations
- **Key Functions**:
  - `getRoles(options)`: Get roles with filtering
  - `getRoleById(id)`: Get single role
  - `getRoleWithUserCount(id)`: Get role with user count
  - `createRole(data, createdBy)`: Create new role
  - `updateRole(id, data, updatedBy)`: Update role
  - `deleteRole(id, deletedBy)`: Soft delete role
  - `getRoleUserCount(roleId)`: Count users with role

### rolePermissionsService.ts (`src/core/lib/services/rolePermissionsService.ts`)
- **Purpose**: Business logic for permission management
- **Key Functions**:
  - `getRolePermissions(roleId)`: Get all permissions for a role
  - `getRoleModulePermissions(roleId, moduleId)`: Get permissions for role/module
  - `updateRoleModulePermissions(...)`: Update role module permissions
  - `getModulePermissions(moduleId)`: Get available permissions for module
  - `getModuleFields(moduleId)`: Get available fields for module

## Database Schema

### Core Tables

#### roles Table
- Primary key: `id` (UUID)
- Key fields:
  - `name`: Role name
  - `code`: Unique role code (uppercase)
  - `description`: Role description
  - `isSystem`: System role flag (cannot be modified)
  - `priority`: Priority for conflict resolution
  - `status`: active or inactive
  - `deletedAt`: Soft delete timestamp

### Permission Tables (`src/core/lib/db/permissionSchema.ts`)

#### role_module_access
- **Purpose**: Controls module access and data access level
- **Key fields**:
  - `roleId`: Foreign key to roles
  - `moduleId`: Foreign key to modules
  - `hasAccess`: Boolean - module enabled for role
  - `dataAccess`: Enum - 'none', 'own', 'team', 'all'
- **Unique constraint**: (roleId, moduleId)

#### role_module_permissions
- **Purpose**: Granular permissions within a module
- **Key fields**:
  - `roleId`: Foreign key to roles
  - `moduleId`: Foreign key to modules
  - `permissionId`: Foreign key to permissions
  - `granted`: Boolean - permission granted
- **Unique constraint**: (roleId, moduleId, permissionId)

#### module_fields
- **Purpose**: Defines fields that can have field-level permissions
- **Key fields**:
  - `moduleId`: Foreign key to modules
  - `name`: Field name
  - `code`: Field code (unique per module)
  - `label`: Display label
  - `fieldType`: Field type (text, number, etc.)
  - `isActive`: Active status
  - `sortOrder`: Display order
- **Unique constraint**: (moduleId, code)

#### role_field_permissions
- **Purpose**: Field-level visibility and editability
- **Key fields**:
  - `roleId`: Foreign key to roles
  - `moduleId`: Foreign key to modules
  - `fieldId`: Foreign key to module_fields
  - `isVisible`: Boolean - field visible
  - `isEditable`: Boolean - field editable
- **Unique constraint**: (roleId, moduleId, fieldId)
- **Note**: Field must be visible to be editable

## Permission Hierarchy

### Level 1: Module Access
- **Control**: Enable/disable access to entire module
- **Storage**: `role_module_access.hasAccess`
- **Effect**: If false, role has no access to module regardless of other permissions

### Level 2: Data Access Level
- **Control**: Scope of data access within module
- **Storage**: `role_module_access.dataAccess`
- **Options**:
  - `none`: No data access
  - `own`: Only own data
  - `team`: Team data
  - `all`: All data
- **Effect**: Determines which records user can access

### Level 3: Granular Permissions
- **Control**: Specific actions within module
- **Storage**: `role_module_permissions`
- **Examples**: View, Edit, Delete, Create, Export, etc.
- **Effect**: Determines what actions user can perform

### Level 4: Field-Level Permissions
- **Control**: Visibility and editability of specific fields
- **Storage**: `role_field_permissions`
- **Options**:
  - `isVisible`: Field visible in UI
  - `isEditable`: Field can be edited
- **Effect**: Fine-grained control over field access
- **Note**: Field must be visible to be editable

## Validation

### roles.ts (`src/core/lib/validations/roles.ts`)
- **Schemas**:
  - `createRoleSchema`: Validation for creating roles
  - `updateRoleSchema`: Validation for updating roles
- **Rules**:
  - Name required, max 255 characters
  - Code required, uppercase letters and underscores only
  - Description optional
  - Priority integer, min 0
  - Status must be: active or inactive

## Security Considerations

1. **System Roles**: Cannot modify code or isSystem flag
2. **System Role Deletion**: Cannot delete system roles
3. **Role with Users**: Cannot delete roles with assigned users
4. **Permission Checks**: All operations require appropriate permissions
5. **Input Validation**: All inputs validated with Zod schemas
6. **Soft Deletes**: Roles are soft-deleted, not hard-deleted

## Common Operations

### Adding a New Module Field
1. Insert into `module_fields` table
2. Field will automatically appear in Permission Assignment
3. Configure visibility/editability per role

### Adding a New Permission
1. Insert into `permissions` table with moduleId
2. Permission will automatically appear in Permission Assignment
3. Grant/deny per role as needed

### Creating a Custom Permission Set
1. Create role via UI or API
2. Expand role in table
3. Click "Configure" on desired module
4. Set module access, data access, granular permissions, and field permissions
5. Save changes

## Integration Points

- **Users**: Roles are assigned to users via `users.roleId`
- **Modules**: Permissions are organized by modules
- **Permissions**: Uses core permission system
- **Navigation**: Listed in Sidebar as static navigation item

## Migration

To set up the permission tables, run the SQL migration:
```sql
-- See: migrations/add_role_permissions_tables.sql
```

This creates:
- `role_module_access` table
- `role_module_permissions` table
- `module_fields` table
- `role_field_permissions` table
- All necessary indexes and constraints

