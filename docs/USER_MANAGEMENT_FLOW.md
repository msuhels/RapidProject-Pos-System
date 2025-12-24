# User Management Flow Documentation

## Overview
User Management is a core feature of the application that allows administrators to create, update, delete, and manage users. It's implemented as a standard Next.js application feature (not a module) and is located in the core application structure.

## Architecture Overview

### Directory Structure
```
src/
├── app/
│   ├── (dashboard)/
│   │   └── users/
│   │       └── page.tsx              # Main User Management page
│   └── api/
│       └── users/
│           ├── route.ts              # GET (list), POST (create) /api/users
│           └── [id]/
│               └── route.ts          # GET, PATCH, DELETE /api/users/:id
├── core/
│   ├── components/
│   │   └── users/
│   │       ├── UserList.tsx          # Component that fetches and displays users
│   │       ├── UserTable.tsx         # Table component with search/filter
│   │       └── UserForm.tsx          # Form for creating/editing users
│   ├── lib/
│   │   ├── services/
│   │   │   └── usersService.ts       # Business logic for user operations
│   │   └── validations/
│   │       └── users.ts              # Zod schemas for user validation
│   └── store/
│       └── authStore.ts             # Zustand store for authentication state
```

## Flow Diagrams

### 1. User List Flow

```
User navigates to /users
    ↓
src/app/(dashboard)/users/page.tsx
    ↓
Checks authentication (useAuthStore)
    ↓
Renders UserList component
    ↓
src/core/components/users/UserList.tsx
    ↓
Fetches users from /api/users
    ↓
src/app/api/users/route.ts (GET)
    ↓
Checks authentication & permissions
    ↓
Calls usersService.getUsers()
    ↓
src/core/lib/services/usersService.ts
    ↓
Queries database (Drizzle ORM)
    ↓
Returns users to component
    ↓
Renders UserTable with data
    ↓
src/core/components/users/UserTable.tsx
    ↓
Displays users in table with search/filter
```

### 2. Create User Flow

```
User clicks "Add User" button
    ↓
src/app/(dashboard)/users/page.tsx
    ↓
Sets showForm = true
    ↓
Renders UserForm component
    ↓
src/core/components/users/UserForm.tsx
    ↓
User fills form and submits
    ↓
Validates with Zod schema
    ↓
src/core/lib/validations/users.ts
    ↓
Calls handleCreate in page.tsx
    ↓
POST /api/users
    ↓
src/app/api/users/route.ts (POST)
    ↓
Validates request body
    ↓
Checks authentication & permissions (users:create)
    ↓
Calls usersService.createUser()
    ↓
src/core/lib/services/usersService.ts
    ↓
Hashes password
    ↓
Inserts user into database
    ↓
Creates auth_provider entry
    ↓
Returns created user
    ↓
Page refreshes user list (refreshTrigger++)
    ↓
UserList refetches and displays new user
```

### 3. Edit User Flow

```
User clicks "Edit" button on a user row
    ↓
src/core/components/users/UserTable.tsx
    ↓
Calls onEditClick(user)
    ↓
src/app/(dashboard)/users/page.tsx
    ↓
Sets editingUser = user, showForm = true
    ↓
Renders UserForm with initialData
    ↓
src/core/components/users/UserForm.tsx
    ↓
Pre-fills form with user data
    ↓
User modifies and submits
    ↓
PATCH /api/users/:id
    ↓
src/app/api/users/[id]/route.ts (PATCH)
    ↓
Validates request body
    ↓
Checks authentication & permissions (users:update)
    ↓
Calls usersService.updateUser()
    ↓
src/core/lib/services/usersService.ts
    ↓
Updates user in database
    ↓
Returns updated user
    ↓
Page refreshes user list
```

### 4. Delete User Flow

```
User clicks "Delete" button on a user row
    ↓
src/core/components/users/UserTable.tsx
    ↓
Calls onDeleteClick(user)
    ↓
src/core/components/users/UserList.tsx
    ↓
Shows confirmation dialog
    ↓
DELETE /api/users/:id
    ↓
src/app/api/users/[id]/route.ts (DELETE)
    ↓
Checks authentication & permissions (users:delete)
    ↓
Prevents self-deletion
    ↓
Calls usersService.deleteUser()
    ↓
src/core/lib/services/usersService.ts
    ↓
Soft deletes user (sets deletedAt)
    ↓
Returns success
    ↓
UserList refetches users
```

## Key Components

### 1. Page Component (`src/app/(dashboard)/users/page.tsx`)
- **Purpose**: Main container for User Management
- **Responsibilities**:
  - Authentication check
  - State management (form visibility, editing user, roles list)
  - Form submission handling
  - Navigation between list and form views
- **Key State**:
  - `showForm`: Controls form visibility
  - `editingUser`: Currently editing user (null for create)
  - `roles`: List of roles for dropdown
  - `refreshTrigger`: Triggers list refresh

### 2. UserList Component (`src/core/components/users/UserList.tsx`)
- **Purpose**: Fetches and manages user data
- **Responsibilities**:
  - Fetching users from API
  - Fetching roles for filters
  - Handling delete operations
  - Passing data to UserTable
- **Props**:
  - `onCreateClick`: Callback to show create form
  - `onEditClick`: Callback to show edit form
  - `refreshTrigger`: Number that triggers refetch when changed

### 3. UserTable Component (`src/core/components/users/UserTable.tsx`)
- **Purpose**: Displays users in a table format
- **Responsibilities**:
  - Rendering user data
  - Search and filter UI
  - Action buttons (Edit, Delete)
- **Features**:
  - Search by name/email
  - Filter by role
  - Filter by status
  - User avatars with initials

### 4. UserForm Component (`src/core/components/users/UserForm.tsx`)
- **Purpose**: Form for creating/editing users
- **Responsibilities**:
  - Form validation
  - Input handling
  - Error display
- **Fields**:
  - Email (required)
  - Full Name (required)
  - Password (required for create, optional for update)
  - Role (dropdown)
  - Status (dropdown: active, inactive, suspended)

## API Endpoints

### GET /api/users
- **Purpose**: List all users with optional filtering
- **Query Parameters**:
  - `search`: Search by email or name
  - `roleId`: Filter by role
  - `status`: Filter by status
  - `limit`: Pagination limit
  - `offset`: Pagination offset
- **Authentication**: Required
- **Permission**: `users:read`
- **Response**: `{ success: true, data: User[], total: number }`

### POST /api/users
- **Purpose**: Create a new user
- **Request Body**: `{ email, password, fullName, roleId?, status? }`
- **Authentication**: Required
- **Permission**: `users:create`
- **Response**: `{ success: true, data: User }`

### GET /api/users/:id
- **Purpose**: Get a single user by ID
- **Authentication**: Required
- **Permission**: `users:read`
- **Response**: `{ success: true, data: User }`

### PATCH /api/users/:id
- **Purpose**: Update a user
- **Request Body**: `{ email?, fullName?, roleId?, status?, password? }`
- **Authentication**: Required
- **Permission**: `users:update`
- **Response**: `{ success: true, data: User }`

### DELETE /api/users/:id
- **Purpose**: Delete a user (soft delete)
- **Authentication**: Required
- **Permission**: `users:delete`
- **Response**: `{ success: true, message: string }`
- **Note**: Prevents self-deletion

## Service Layer

### usersService.ts (`src/core/lib/services/usersService.ts`)
- **Purpose**: Business logic for user operations
- **Key Functions**:
  - `getUsers(options)`: Get users with filtering
  - `getUserById(id)`: Get single user
  - `getUserWithRole(id)`: Get user with role information
  - `createUser(data, createdBy)`: Create new user
  - `updateUser(id, data, updatedBy)`: Update user
  - `deleteUser(id, deletedBy)`: Soft delete user
  - `getUserCountByRole(roleId)`: Count users with role

## Validation

### users.ts (`src/core/lib/validations/users.ts`)
- **Schemas**:
  - `createUserSchema`: Validation for creating users
  - `updateUserSchema`: Validation for updating users
- **Rules**:
  - Email must be valid
  - Password minimum 6 characters
  - Full name required
  - Role ID must be UUID (optional)
  - Status must be: active, inactive, or suspended

## Database Schema

### users Table
- Primary key: `id` (UUID)
- Key fields:
  - `email`: Unique email address
  - `passwordHash`: Hashed password
  - `fullName`: User's full name
  - `roleId`: Foreign key to roles table
  - `status`: active, inactive, or suspended
  - `deletedAt`: Soft delete timestamp

## Authentication & Authorization

### Authentication Check
- All pages check `useAuthStore` for authentication
- Redirects to `/login` if not authenticated
- Uses `_hasHydrated` flag to prevent premature redirects on page refresh

### Permission Checks
- All API endpoints use `requirePermission` middleware
- Required permissions:
  - `users:read` - View users
  - `users:create` - Create users
  - `users:update` - Update users
  - `users:delete` - Delete users
- SUPER_ADMIN role bypasses all permission checks

## State Management

### Auth Store (`src/core/store/authStore.ts`)
- Uses Zustand with persistence
- Stores:
  - `user`: Current user object
  - `isAuthenticated`: Authentication status
  - `accessToken`: JWT token
  - `token`: Alias for accessToken
  - `_hasHydrated`: Hydration status

## Error Handling

### Client-Side
- Form validation errors displayed inline
- API errors shown as alerts
- Loading states during operations

### Server-Side
- Validation errors return 400 status
- Permission errors return 403 status
- Not found errors return 404 status
- Server errors return 500 status

## Security Considerations

1. **Password Hashing**: Passwords are hashed using bcrypt before storage
2. **Soft Deletes**: Users are soft-deleted (deletedAt set) not hard-deleted
3. **Self-Deletion Prevention**: Users cannot delete their own account
4. **Permission Checks**: All operations require appropriate permissions
5. **Input Validation**: All inputs validated with Zod schemas
6. **SQL Injection**: Protected by Drizzle ORM parameterized queries

## Common Operations

### Adding a New User Field
1. Update database schema in `src/core/lib/db/baseSchema.ts`
2. Update validation schema in `src/core/lib/validations/users.ts`
3. Update UserForm component to include new field
4. Update usersService to handle new field
5. Run database migration

### Customizing User Table
1. Modify `UserTable.tsx` to add/remove columns
2. Update search/filter logic if needed
3. Adjust styling in component

### Adding Custom Validation
1. Update Zod schema in `src/core/lib/validations/users.ts`
2. Error messages automatically displayed in form

## Integration Points

- **Roles**: Users are linked to roles via `roleId`
- **Authentication**: Uses same auth system as rest of app
- **Permissions**: Uses core permission system
- **Navigation**: Listed in Sidebar as static navigation item

