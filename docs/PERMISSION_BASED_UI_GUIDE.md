# Permission-Based UI Implementation Guide

This guide explains how to implement permission-based UI controls across all modules in the application.

## Overview

The application now supports dynamic UI rendering based on user permissions. UI elements (buttons, forms, actions) are automatically shown or hidden based on what permissions the logged-in user has.

## Core Components

### 1. `PermissionGate` Component

Conditionally renders children based on permissions.

**Usage:**
```tsx
import { PermissionGate } from '@/core/components/common/PermissionGate';

// Single permission
<PermissionGate permission="users:create">
  <Button>Add User</Button>
</PermissionGate>

// Multiple permissions (any)
<PermissionGate permission={["users:update", "users:delete"]} requireAll={false}>
  <Button>Edit or Delete</Button>
</PermissionGate>

// Multiple permissions (all required)
<PermissionGate permission={["users:update", "users:manage"]} requireAll={true}>
  <Button>Advanced Edit</Button>
</PermissionGate>

// With fallback
<PermissionGate permission="users:create" fallback={<p>No access</p>}>
  <Button>Add User</Button>
</PermissionGate>
```

### 2. `ProtectedPage` Component

Protects entire pages and shows access denied message if user lacks permission.

**Usage:**
```tsx
import { ProtectedPage } from '@/core/components/common/ProtectedPage';

export default function MyPage() {
  return (
    <ProtectedPage
      permission="mymodule:read"
      title="My Module"
      description="Manage my module data"
    >
      {/* Page content here */}
    </ProtectedPage>
  );
}
```

### 3. `usePermissionProps` Hook

Get permission booleans for a module.

**Usage:**
```tsx
import { usePermissionProps } from '@/core/components/common/PermissionGate';

function MyComponent() {
  const { canView, canCreate, canUpdate, canDelete, canManage } = usePermissionProps('users');
  
  return (
    <div>
      {canCreate && <Button>Add</Button>}
      {canUpdate && <Button>Edit</Button>}
      {canDelete && <Button>Delete</Button>}
    </div>
  );
}
```

### 4. `usePermissions` Hook

Low-level hook for custom permission checks.

**Usage:**
```tsx
import { usePermissions } from '@/core/hooks/usePermissions';

function MyComponent() {
  const { hasPermission, hasAnyPermission, hasAllPermissions, permissions, loading } = usePermissions();
  
  if (loading) return <div>Loading...</div>;
  
  const canDoSomething = hasPermission('mymodule:action');
  const canDoAny = hasAnyPermission(['module:action1', 'module:action2']);
  const canDoAll = hasAllPermissions(['module:action1', 'module:action2']);
  
  return <div>{/* Your UI */}</div>;
}
```

## Permission Naming Convention

Permissions follow the format: `module:action`

### Standard Actions:
- `read` - View/list items
- `create` - Create new items
- `update` - Edit existing items
- `delete` - Delete items
- `manage` - Full management access
- `*` - Wildcard (all actions)

### Examples:
- `users:read` - View users
- `users:create` - Create users
- `users:update` - Edit users
- `users:delete` - Delete users
- `users:*` - All user permissions
- `roles:manage` - Manage roles and permissions

## Implementation Steps for Each Module

### Step 1: Wrap Page with ProtectedPage

```tsx
// Before
export default function MyModulePage() {
  return (
    <div>
      <PageHeader title="My Module" />
      {/* content */}
    </div>
  );
}

// After
export default function MyModulePage() {
  return (
    <ProtectedPage
      permission="mymodule:read"
      title="My Module"
      description="Manage my module"
    >
      <div>
        <PageHeader title="My Module" />
        {/* content */}
      </div>
    </ProtectedPage>
  );
}
```

### Step 2: Add Permission Checks for Actions

```tsx
export default function MyModulePage() {
  const { canCreate, canUpdate, canDelete } = usePermissionProps('mymodule');
  
  return (
    <ProtectedPage permission="mymodule:read" title="My Module">
      <div>
        <MyModuleList
          onCreateClick={canCreate ? handleCreate : undefined}
          onEditClick={canUpdate ? handleEdit : undefined}
          onDeleteClick={canDelete ? handleDelete : undefined}
        />
      </div>
    </ProtectedPage>
  );
}
```

### Step 3: Add Permission Checks in Components

```tsx
// In your list/table component
interface MyModuleListProps {
  onCreateClick?: () => void;
  onEditClick?: (item: Item) => void;
  onDeleteClick?: (item: Item) => void;
}

export function MyModuleList({ onCreateClick, onEditClick, onDeleteClick }: MyModuleListProps) {
  return (
    <div>
      {/* Only show Add button if handler is provided */}
      {onCreateClick && (
        <Button onClick={onCreateClick}>Add Item</Button>
      )}
      
      <Table>
        {items.map(item => (
          <TableRow key={item.id}>
            <TableCell>{item.name}</TableCell>
            <TableCell>
              {/* Only show Edit button if handler is provided */}
              {onEditClick && (
                <Button onClick={() => onEditClick(item)}>Edit</Button>
              )}
              
              {/* Only show Delete button if handler is provided */}
              {onDeleteClick && (
                <Button onClick={() => onDeleteClick(item)}>Delete</Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
```

### Step 4: Add Runtime Permission Checks

```tsx
const handleEdit = (item: Item) => {
  if (!canUpdate) {
    toast.error('You do not have permission to update items');
    return;
  }
  
  // Proceed with edit
  setEditingItem(item);
  setShowForm(true);
};

const handleDelete = async (item: Item) => {
  if (!canDelete) {
    toast.error('You do not have permission to delete items');
    return;
  }
  
  // Proceed with delete
  await deleteItem(item.id);
};
```

## Complete Example: Notes Module

```tsx
'use client';

import { useState } from 'react';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { usePermissionProps } from '@/core/components/common/PermissionGate';
import { NoteList } from '@/components/notes/NoteList';
import { NoteForm } from '@/components/notes/NoteForm';
import { toast } from 'sonner';

export default function NotesPage() {
  const { canCreate, canUpdate, canDelete } = usePermissionProps('notes');
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const handleCreate = () => {
    if (!canCreate) {
      toast.error('You do not have permission to create notes');
      return;
    }
    setShowForm(true);
  };

  const handleEdit = (note) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update notes');
      return;
    }
    setEditingNote(note);
    setShowForm(true);
  };

  const handleDelete = async (note) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete notes');
      return;
    }
    // Delete logic here
  };

  return (
    <ProtectedPage
      permission="notes:read"
      title="Notes"
      description="Manage your notes"
    >
      <div className="container mx-auto py-6 px-4">
        {showForm ? (
          <NoteForm
            note={editingNote}
            onCancel={() => {
              setShowForm(false);
              setEditingNote(null);
            }}
          />
        ) : (
          <NoteList
            onCreateClick={canCreate ? handleCreate : undefined}
            onEditClick={canUpdate ? handleEdit : undefined}
            onDeleteClick={canDelete ? handleDelete : undefined}
          />
        )}
      </div>
    </ProtectedPage>
  );
}
```

## Permission Matrix by Role

| Role | users:read | users:create | users:update | users:delete | roles:manage |
|------|-----------|--------------|--------------|--------------|--------------|
| USER | ❌ | ❌ | ❌ | ❌ | ❌ |
| EDITOR | ✅ | ❌ | ❌ | ❌ | ❌ |
| MANAGER | ✅ | ✅ | ✅ | ❌ | ❌ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |

## Best Practices

1. **Always check permissions on both frontend AND backend**
   - Frontend: Hide UI elements
   - Backend: Enforce access control

2. **Use semantic permission names**
   - Good: `users:create`, `notes:delete`
   - Bad: `action1`, `do_thing`

3. **Provide user feedback**
   - Always use Sonner `toast` notifications for success, error, and blocked actions (no `alert`)
   - Display "Access Denied" pages clearly

4. **Handle loading states**
   - Show loading indicators while permissions load
   - Don't flash UI elements that will be hidden

5. **Use optional handlers**
   - Pass `undefined` instead of handlers when no permission
   - Components check for handler existence before rendering buttons

6. **Test with different roles**
   - Verify UI changes for each role
   - Ensure no unauthorized actions are possible

## Troubleshooting

### UI elements not hiding
- Check if `usePermissionProps` is called correctly
- Verify permission codes match database
- Check if handlers are conditionally passed

### "Access Denied" showing incorrectly
- Verify user has the required permission in database
- Check `user_roles` and `role_permissions` tables
- Clear browser cache and re-login

### Permissions not loading
- Check `/api/auth/permissions` endpoint
- Verify authentication token is valid
- Check browser console for errors

## Related Files

- `/src/core/components/common/PermissionGate.tsx` - Permission gate component
- `/src/core/components/common/ProtectedPage.tsx` - Protected page wrapper
- `/src/core/hooks/usePermissions.ts` - Permissions hook
- `/src/core/lib/permissions.ts` - Backend permission checks
- `/src/app/api/auth/permissions/route.ts` - Permissions API endpoint

