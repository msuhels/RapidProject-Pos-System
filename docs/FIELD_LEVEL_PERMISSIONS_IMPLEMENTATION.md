# Field-Level Permissions Implementation Guide

## Overview

This document describes the implementation of field-level permissions in the application. Field-level permissions allow administrators to control which fields users can view and edit based on their role assignments.

## Architecture

### 1. Database Schema

Field-level permissions are stored in the following tables:

- **`module_fields`**: Defines all fields (both system and custom) for each module
  - Contains fields like `id`, `moduleId`, `code`, `label`, `fieldType`, `isSystemField`, `isActive`
  - System fields are the default/core fields (e.g., `title`, `email`, `status`)
  - Custom fields are user-created additional fields

- **`role_field_permissions`**: Stores visibility and editability permissions per role, module, and field
  - Fields: `roleId`, `moduleId`, `fieldId`, `isVisible`, `isEditable`
  - A field must be visible to be editable
  - If no permission exists for a field, it defaults to not visible

### 2. API Endpoint

**`GET /api/auth/field-permissions`**

Fetches field-level permissions for the current authenticated user across all modules (or a specific module).

**Query Parameters:**
- `moduleCode` (optional): Filter by specific module code (e.g., `students`, `projects`)

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "moduleCode": "students",
      "moduleName": "Students",
      "fields": [
        {
          "fieldCode": "rollNumber",
          "fieldName": "Roll Number",
          "fieldLabel": "Roll Number",
          "isVisible": true,
          "isEditable": true
        },
        {
          "fieldCode": "email",
          "fieldName": "Email",
          "fieldLabel": "Email",
          "isVisible": true,
          "isEditable": false
        }
      ]
    }
  ]
}
```

**Permission Logic:**
- Super Admin automatically has visibility and editability for all fields
- For users with multiple roles, permissions are aggregated using OR logic (most permissive wins)
- Fields with no explicit permissions default to not visible

### 3. React Hook: `useFieldPermissions`

Located at `src/core/hooks/useFieldPermissions.ts`

**Usage:**
```tsx
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';

function MyComponent() {
  const { 
    isFieldVisible,
    isFieldEditable,
    getVisibleFields,
    getEditableFields,
    loading 
  } = useFieldPermissions('students'); // Optional module filter

  // Check if a specific field is visible
  if (isFieldVisible('students', 'rollNumber')) {
    // Render field
  }

  // Check if a field is editable
  const editable = isFieldEditable('students', 'email');

  // Get all visible fields for a module
  const visibleFields = getVisibleFields('students');
}
```

**API:**
- `isFieldVisible(moduleCode, fieldCode)`: Returns boolean indicating if field is visible
- `isFieldEditable(moduleCode, fieldCode)`: Returns boolean indicating if field is editable
- `getVisibleFields(moduleCode)`: Returns array of all visible field definitions
- `getEditableFields(moduleCode)`: Returns array of all editable field definitions
- `loading`: Boolean indicating if permissions are still loading
- `error`: Error message if fetching permissions failed
- `refetch()`: Function to manually refetch permissions

## Implementation in Modules

### Students Module Example

#### Table Component (`StudentsTable.tsx`)

```tsx
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';

export function StudentsTable({ students, ...props }) {
  const { isFieldVisible, loading: loadingPermissions } = useFieldPermissions('students');
  
  // Define standard fields
  const STANDARD_FIELDS = [
    { code: 'rollNumber', label: 'Roll #', render: (s) => s.rollNumber },
    { code: 'fullName', label: 'Name', render: (s) => s.fullName },
    { code: 'email', label: 'Email', render: (s) => s.email },
    // ... more fields
  ];

  // Filter visible fields based on permissions
  const visibleFields = STANDARD_FIELDS.filter(f => 
    isFieldVisible('students', f.code)
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {visibleFields.map(field => (
            <TableHead key={field.code}>{field.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map(student => (
          <TableRow key={student.id}>
            {visibleFields.map(field => (
              <TableCell key={field.code}>
                {field.render(student)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

#### Form Component (`StudentsForm.tsx`)

```tsx
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';

export function StudentsForm({ form, onChange }) {
  const { isFieldVisible, isFieldEditable, loading } = useFieldPermissions('students');
  
  // Define field configuration
  const FIELDS = [
    { code: 'rollNumber', label: 'Roll number', type: 'text' },
    { code: 'fullName', label: 'Full name', type: 'text' },
    { code: 'email', label: 'Email', type: 'email' },
    // ... more fields
  ];

  // Filter visible fields
  const visibleFields = FIELDS.filter(f => isFieldVisible('students', f.code));

  return (
    <div className="space-y-4">
      {visibleFields.map(field => {
        const editable = isFieldEditable('students', field.code);
        
        return (
          <div key={field.code}>
            <Label>
              {field.label}
              {!editable && <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>}
            </Label>
            <Input
              value={form[field.code] || ''}
              onChange={(e) => updateField(field.code, e.target.value)}
              disabled={!editable}
            />
          </div>
        );
      })}
    </div>
  );
}
```

### Projects Module Example

The Projects module follows the same pattern. See:
- `src/modules/projects/components/ProjectTable.tsx`
- `src/modules/projects/components/ProjectForm.tsx`

## Setting Up Field Permissions for a Module

### Step 1: Define Module Fields

Create a field configuration file (e.g., `src/modules/[module]/config/fields.config.ts`):

```typescript
export interface ModuleFieldDefinition {
  name: string;
  code: string;
  label: string;
  fieldType: string;
  description?: string | null;
  sortOrder: number;
}

export const MODULE_FIELDS: ModuleFieldDefinition[] = [
  { name: 'Title', code: 'title', label: 'Title', fieldType: 'text', sortOrder: 1 },
  { name: 'Description', code: 'description', label: 'Description', fieldType: 'textarea', sortOrder: 2 },
  // ... more fields
];
```

### Step 2: Register Fields in Seed/Migration

In your module's seed file, insert fields into the `module_fields` table:

```typescript
import { moduleFields } from '@/core/lib/db/permissionSchema';
import { MODULE_FIELDS } from '../config/fields.config';

for (const field of MODULE_FIELDS) {
  await db.insert(moduleFields).values({
    moduleId,
    name: field.name,
    code: field.code,
    label: field.label,
    fieldType: field.fieldType,
    description: field.description,
    isSystemField: true, // Mark as system field
    isActive: true,
    sortOrder: field.sortOrder,
  });
}
```

### Step 3: Update Table Component

1. Import `useFieldPermissions` hook
2. Define field configurations with render functions
3. Filter visible fields using `isFieldVisible`
4. Render only visible columns

### Step 4: Update Form Component

1. Import `useFieldPermissions` hook
2. Define field configurations
3. Filter visible fields using `isFieldVisible`
4. Check editability using `isFieldEditable`
5. Render fields with appropriate disabled state

## Configuring Permissions via UI

1. **Navigate to Role Management**: Go to Settings > Role Management
2. **Select a Role**: Click on a role to view/edit permissions
3. **Open Module Permissions**: Click on a module to expand its permissions
4. **Configure Field Permissions**: 
   - In the "Field Level Permission" section, check visibility and editability for each field
   - Note: A field must be visible to be editable
5. **Save**: Click "Update Permissions" to save changes

## Best Practices

1. **System Fields**: Mark core/default fields as `isSystemField: true` to distinguish them from custom fields
2. **Visibility First**: Always check visibility before rendering a field
3. **Editability Control**: Use the `disabled` prop on inputs based on `isFieldEditable`
4. **Loading States**: Handle the loading state from `useFieldPermissions` to avoid flickering
5. **Default Deny**: If no permission is set, default to not visible (secure by default)
6. **Super Admin**: Super Admin role automatically has full visibility and editability
7. **Multiple Roles**: When a user has multiple roles, use OR logic (most permissive wins)

## Permission Hierarchy

1. **Super Admin**: Full access to all fields (overrides all other rules)
2. **Multiple Roles**: If user has multiple roles, permissions are combined using OR logic
3. **No Permission**: If no explicit permission exists, field is not visible

## Field Types Supported

- `text`: Single-line text input
- `textarea`: Multi-line text input
- `email`: Email input with validation
- `number`: Numeric input
- `date`: Date picker
- `select`: Dropdown selection
- `boolean`: Checkbox
- `url`: URL input
- `json`: JSON data (for advanced fields)

## Testing Field Permissions

1. **Create Test Roles**: Create roles with different field permission configurations
2. **Assign to Test Users**: Assign test users to these roles
3. **Verify Table Display**: Login as test user and verify only permitted fields show in tables
4. **Verify Form Behavior**: Open forms and verify:
   - Non-visible fields don't appear
   - Non-editable fields are disabled/read-only
   - Visible and editable fields work normally

## Troubleshooting

### Fields Not Showing
- Verify field is registered in `module_fields` table
- Check `role_field_permissions` has entry with `isVisible: true`
- Verify module access is granted in `role_module_access`
- Check for console errors in browser dev tools

### Fields Not Editable
- Verify `isEditable: true` in `role_field_permissions`
- Ensure `isVisible: true` (field must be visible to be editable)
- Check that form component is using `isFieldEditable` check

### Permissions Not Loading
- Check network tab for API call to `/api/auth/field-permissions`
- Verify user is authenticated and has valid token
- Check server logs for any errors

## Related Files

- **API**: `src/app/api/auth/field-permissions/route.ts`
- **Hook**: `src/core/hooks/useFieldPermissions.ts`
- **Schema**: `src/core/lib/db/permissionSchema.ts`
- **Service**: `src/core/lib/services/rolePermissionsService.ts`
- **Examples**: 
  - `src/modules/students/components/StudentsTable.tsx`
  - `src/modules/students/components/StudentsForm.tsx`
  - `src/modules/projects/components/ProjectTable.tsx`
  - `src/modules/projects/components/ProjectForm.tsx`

