1. please dont create documentation for any changes 
2. please use proper project structure for separate modules according to the template module structure   inside the modules folder 
3. please use proper shadcn ui for the project and its related ui components for everything related to ui 
4. every implementation of the ui should be responsive properly
5. always check for linting error for all the files where you make implementations and updates 

# New Dynamic Modules (rules)

6. when creating any **new dynamic module**, always:
   - follow the **standard module folder structure** shown below (`module.config.json`, `api/`, `routes/`, `components`, `schemas`, `services`, `config`, `hooks`, `seeds`, `store`, `types`, `utils`, `index.ts`)
   - implement **proper routing and navigation** according to the prompt:
     - define `routes/*.tsx` files following the naming rules
     - ensure paths in `module.config.json` point to the correct route files
     - make sure the module shows up correctly in the app navigation if required
   - create a **seed script** for that module to insert:
     - basic CRUD permissions for that module (create, read/list, update, delete, detail as needed)
     - any **extra permissions** explicitly mentioned in the prompt for role management
     - required **module_fields** (for filters, forms, listing columns, etc.)
   - implement **basic CRUD API endpoints** in `api/handlers`:
     - `list.ts`, `detail.ts`, `create.ts`, `update.ts`, `delete.ts` (or as required by the prompt)
     - wire them to `endpoints.ts` + `module.config.json` using the same pattern as existing modules
   - implement **proper filters**:
     - add filterable fields in the module schema / module_fields
     - expose filters in the UI (filter components, search, status, date range, etc.)
     - apply filters in the list API handler (query params → DB query conditions)
     - for every module, include at least a lightweight advanced filter bar (search + status + 1–2 extra relevant filters) following existing patterns (for example Projects)
     - when any filter is applied, show a clear “Clear filters” action that resets all filters back to defaults and reloads data
   - implement **module labels** when the prompt mentions labels/tagging:
     - use the core `module_labels` table and `/api/modules/labels` endpoints, resolving `moduleId` by `module.config.json.id` (for example `notes` → `NOTES` row in `modules`)
     - create a module-specific hook (for example `useNoteLabels`, `useTaskLabels`) and a labels dialog component inside the module (for example `NoteLabelsDialog`) – do not reuse another module’s labels hook/dialog directly
     - render a “Manage labels” UI entry point only when the user has the `<module>:manage_labels` (or `<module>:*`) permission
     - expose labels in create/update forms as selectable chips bound to `labelIds`, and surface applied labels in list rows for quick visual context
   - ensure the module **lists data correctly on the UI**:
     - show list views with columns that match the fields
     - handle empty states, loading states, and error states
     - support pagination / sorting when appropriate
   - ensure **role-based conditional rendering**:
     - hide or disable actions (create, edit, delete, special actions) when the user lacks permission
     - hide or restrict routes / navigation entries if user has no access
     - never rely only on UI checks; backend handlers must also enforce permissions
   - keep modules **fully dynamic** and driven from config + permissions where possible, consistent with existing modules.

7. if the prompt mentions **extra behaviours or extra permissions** (custom actions, custom statuses, extra fields, advanced filters, imports, exports, dashboards, label management, duplication, etc.), extend:
   - the module **seed** to include those extra permissions and module_fields (for example `<module>:import`, `<module>:export`, `<module>:manage_labels`, `<module>:duplicate`)
   - the **API/handlers + services** to implement that extra behaviour (for example import/export endpoints, label CRUD wired to `module_labels`, duplicate endpoints)
   - the **UI** to expose those actions / filters / views with proper role checks (for example buttons for Import, Export, Manage labels, Duplicate that only render when the corresponding permission is granted).

8. when a prompt gives a **reference module** (for example "similar to Projects" / "like Tasks"):
   - use that module only as a **pattern and reference**, do **not** blindly copy all files or logic
   - only copy or adapt what is explicitly mentioned in the prompt (for example basic CRUD flow, some schema parts, or specific filters)
   - you may reuse parts of the schema or behaviour **only if** the new module is really close in business logic to the referenced one
   - still create a **separate, clean module** with its own schemas, permissions, seeds, routes, and UI – no tight coupling between modules.

9. always prefer **existing patterns** from other modules (Projects, Tasks, etc.):
   - reuse list/detail layout patterns
   - reuse filter bar / toolbar components
   - reuse permission checking services / helpers
   - follow the same naming, structure, and flow so modules stay consistent.

10. do not add new libraries or patterns for common things (filters, tables, CRUD, toasts, dialogs) when there is already a core or module-specific solution doing the same job.

11. always test the new module end-to-end:
    - seeding (`npm run seed`) works and inserts permissions + fields without duplicates
    - navigation and routes load without errors
    - CRUD operations work according to the prompt
    - filters + role-based visibility behave correctly for different roles.

# Schema Design & Field Selection (ESSENTIAL)

12. **BEFORE creating a new dynamic module**, always:
    - **Review existing modules** (Projects, Tasks, etc.) in `src/modules/` to understand patterns
    - **Check the database schema** (`db/DATABASE_SCHEMA.sql`) to see:
      - What core tables exist (users, tenants, roles, permissions, modules, etc.)
      - What foreign key patterns are used
      - What common fields are standard (tenant_id, created_by, updated_by, created_at, updated_at, deleted_at)
      - What JSONB fields are used for extensibility (custom_fields, settings, metadata)
    - **Analyze reference modules** mentioned in the prompt to understand:
      - Which fields are actually used in queries/filters
      - Which relationships are essential vs optional
      - What patterns work well for similar use cases

13. **Essential fields** - ALWAYS include these when creating a new module table:
    - `id` (UUID, primary key, default gen_random_uuid())
    - `tenant_id` (UUID, foreign key to tenants, NOT NULL) - REQUIRED for multi-tenancy
    - `created_at` (TIMESTAMP, default now(), NOT NULL)
    - `updated_at` (TIMESTAMP, default now(), NOT NULL)
    - `created_by` (UUID, foreign key to users, nullable but recommended)
    - `updated_by` (UUID, foreign key to users, nullable)
    - `deleted_at` (TIMESTAMP, nullable) - for soft deletes if module needs deletion tracking
    - `status` (VARCHAR, with appropriate default) - if module has lifecycle states
    - `is_active` (BOOLEAN, default true) - if module needs enable/disable functionality

14. **Foreign key relationships** - Add ONLY when:
    - **Essential for core functionality**: The relationship is required for the module to work (e.g., tasks.project_id, project_members.user_id)
    - **Referenced in filters/queries**: The relationship will be used in WHERE clauses, JOINs, or filtering
    - **Business logic dependency**: The module's business rules require the relationship (e.g., tasks cannot exist without a tenant)
    - **DO NOT add** foreign keys for:
      - "Nice to have" relationships that might be used later
      - Relationships that can be handled via JSONB custom_fields
      - Optional relationships that are rarely queried (consider JSONB instead)

15. **Non-essential fields** - Use JSONB for extensibility instead:
    - `custom_fields` (JSONB, default '{}') - for module-specific custom data
    - `settings` (JSONB, default '{}') - for configuration/preferences
    - `metadata` (JSONB, default '{}') - for additional unstructured data
    - Use JSONB when:
      - Fields might vary per tenant/use case
      - Fields are optional and not frequently filtered
      - Fields are experimental or subject to change
      - You need flexibility without schema migrations

16. **Field selection decision tree**:
    ```
    Is this field required for core functionality?
    ├─ YES → Add as column (with appropriate type, NOT NULL if required)
    └─ NO → Is it frequently filtered/searched?
        ├─ YES → Add as column (with index if needed)
        └─ NO → Is it a relationship?
            ├─ YES → Is it essential for business logic?
            │   ├─ YES → Add foreign key column
            │   └─ NO → Consider JSONB or skip
            └─ NO → Use JSONB custom_fields or metadata
    ```

17. **Common patterns from existing modules**:
    - **Projects module**: tenant_id, created_by, status, priority, dates (start_date, deadline), financial fields (budget, spent), JSONB for labels/custom_fields
    - **Tasks module**: tenant_id, project_id (FK), assigned_to (FK), status, priority, dates, hours tracking, JSONB for labels/custom_fields
    - **Project Members**: tenant_id, project_id (FK), user_id (FK), role, hourly_rate
    - **Pattern**: Always include tenant_id, use foreign keys for core relationships, use JSONB for flexible/extensible data

18. **Indexing strategy**:
    - **ALWAYS index**: tenant_id (for multi-tenant queries), foreign key columns (for JOINs)
    - **Index when**: Field is used in WHERE clauses, ORDER BY, or filtering
    - **Consider unique indexes**: For business rules (e.g., unique project_code per tenant)
    - **Reference existing modules** to see what indexes they use for similar patterns

19. **Schema validation**:
    - Before finalizing schema, verify:
      - All essential fields are present
      - Foreign keys reference existing tables correctly
      - Field types match the use case (VARCHAR length, NUMERIC precision, etc.)
      - Default values are appropriate
      - NOT NULL constraints are only on truly required fields
    - Compare with similar modules to ensure consistency

# Role-Based Field Permissions & UI Rendering (ESSENTIAL)

20. **Field-level permissions system** - The framework uses a three-tier permission system:
    - **Module Access** (`role_module_access`): Controls if a role can access a module at all
    - **Data Permissions** (`role_module_permissions`): Controls CRUD operations (create, read, update, delete, etc.)
    - **Field Permissions** (`role_field_permissions`): Controls visibility and editability of individual fields
    - **ALWAYS check all three levels** when rendering UI - a user needs module access + data permission + field permission

21. **Field permissions structure** (`role_field_permissions` table):
    - `is_visible` (BOOLEAN): Controls if the field is shown in the UI at all
    - `is_editable` (BOOLEAN): Controls if the field can be edited (only relevant if `is_visible` is true)
    - **Rule**: `is_editable` can only be true if `is_visible` is true (enforced in UI, not DB constraint)
    - Each field permission is scoped to: `role_id` + `module_id` + `field_id` (unique combination)

22. **Module fields registration** - Before field permissions work:
    - **MUST register fields** in `module_fields` table for each module
    - Fields are registered via seed scripts when creating a module
    - Each field needs: `module_id`, `name`, `code`, `label`, `field_type`, `is_active`, `sort_order`
    - Field `code` should match the database column name or logical field identifier
    - **Example**: For Projects module, register fields like: `title`, `description`, `status`, `priority`, `budget_amount`, etc.

23. **Getting field permissions in UI**:
    - Use `getRoleModulePermissions(roleId, moduleId)` from `@/core/lib/services/rolePermissionsService`
    - Returns `ModulePermission` object with `fields` array containing:
      ```typescript
      {
        fieldId: string;
        fieldName: string;
        fieldCode: string;
        fieldLabel: string;
        isVisible: boolean;
        isEditable: boolean;
      }
      ```
    - **Cache permissions** in component state or store to avoid repeated API calls
    - **Get current user's role** from session/auth context to fetch their permissions

24. **Rendering fields conditionally in forms**:
    ```typescript
    // ✅ CORRECT - Check field permissions before rendering
    const fieldPermissions = await getRoleModulePermissions(userRoleId, moduleId);
    const titleField = fieldPermissions?.fields.find(f => f.fieldCode === 'title');
    
    {titleField?.isVisible && (
      <FormField
        name="title"
        disabled={!titleField.isEditable}
        // ... field props
      />
    )}
    
    // ❌ WRONG - Don't render all fields without permission checks
    <FormField name="title" /> // Missing permission check
    ```

25. **Rendering fields in list/detail views**:
    ```typescript
    // ✅ CORRECT - Filter columns based on field visibility
    const visibleFields = fieldPermissions?.fields
      .filter(f => f.isVisible)
      .map(f => f.fieldCode);
    
    <Table>
      {visibleFields.includes('title') && <TableColumn header="Title" />}
      {visibleFields.includes('status') && <TableColumn header="Status" />}
      {/* Only show columns for visible fields */}
    </Table>
    
    // ❌ WRONG - Show all columns without checking permissions
    <Table>
      <TableColumn header="Title" />
      <TableColumn header="Status" />
    </Table>
    ```

26. **Field editability rules**:
    - **Read-only mode**: `isVisible: true, isEditable: false` → Show field but disable input
    - **Hidden field**: `isVisible: false` → Don't render field at all (regardless of `isEditable`)
    - **Editable field**: `isVisible: true, isEditable: true` → Show field and allow editing
    - **Always respect data permissions**: Even if field is editable, user must have `update` permission for the module
    - **Create forms**: Check `is_visible` to show fields, `is_editable` to allow input (user also needs `create` permission)
    - **Edit forms**: Check `is_visible` to show fields, `is_editable` to allow editing (user also needs `update` permission)
    - **Detail views**: Check `is_visible` to show fields (user needs `read` or `detail` permission)

27. **Permission checking hierarchy** (check in this order):
    ```
    1. Module Access Check
       ├─ User has access to module? (role_module_access.hasAccess)
       └─ NO → Hide entire module/route
       └─ YES → Continue to step 2
    
    2. Data Permission Check
       ├─ User has required data permission? (e.g., projects.read, projects.update)
       └─ NO → Show error/unauthorized message
       └─ YES → Continue to step 3
    
    3. Field Permission Check
       ├─ Field is visible? (role_field_permissions.isVisible)
       └─ NO → Don't render field
       └─ YES → Check editability
          ├─ Field is editable? (role_field_permissions.isEditable)
          ├─ YES → Render as editable input
          └─ NO → Render as read-only/disabled
    ```

28. **Backend validation** - NEVER trust UI-only checks:
    - **API handlers MUST validate** field permissions server-side
    - When processing create/update requests:
      - Check if user has module access
      - Check if user has create/update permission
      - Check if each field being updated has `is_editable: true` for user's role
      - Reject requests that try to update non-editable fields
    - **Example validation in update handler**:
      ```typescript
      // Get user's field permissions
      const permissions = await getRoleModulePermissions(userRoleId, moduleId);
      const fieldPerms = new Map(permissions.fields.map(f => [f.fieldCode, f]));
      
      // Validate each field in update payload
      for (const [fieldCode, value] of Object.entries(updateData)) {
        const fieldPerm = fieldPerms.get(fieldCode);
        if (!fieldPerm?.isVisible) {
          throw new Error(`Field ${fieldCode} is not visible`);
        }
        if (!fieldPerm?.isEditable) {
          throw new Error(`Field ${fieldCode} is not editable`);
        }
      }
      ```

29. **Seeding field permissions** - When creating a new module:
    - **Register module fields** in seed script: Insert into `module_fields` table
    - **Set default field permissions** for roles in seed script: Insert into `role_field_permissions` table
    - **Common defaults**:
      - Admin roles: All fields `is_visible: true, is_editable: true`
      - Manager roles: Most fields visible, some sensitive fields read-only
      - Member roles: Limited fields visible, most fields read-only
      - Public/Guest roles: Very limited fields visible, all read-only
    - **Reference existing module seeds** (Projects, Tasks) to see the pattern

30. **UI component patterns**:
    - **Create reusable field wrapper component** that handles permission checks:
      ```typescript
      <PermissionField
        fieldCode="title"
        moduleId={moduleId}
        render={(isVisible, isEditable) => (
          isVisible && (
            <FormField
              name="title"
              disabled={!isEditable}
            />
          )
        )}
      />
      ```
    - **Create permission hooks** for cleaner code:
      ```typescript
      const { isFieldVisible, isFieldEditable } = useFieldPermissions(moduleId);
      {isFieldVisible('title') && <FormField disabled={!isFieldEditable('title')} />}
      ```
    - **Always provide visual feedback** for read-only fields (grayed out, disabled styling, read-only badge)

31. **Testing field permissions**:
    - Test with different roles to ensure fields render correctly
    - Test that hidden fields don't appear in forms or lists
    - Test that read-only fields show but can't be edited
    - Test that backend rejects updates to non-editable fields
    - Test that permission changes (via role management UI) immediately reflect in the module UI

# Seeding & Modules (recent changes)
- Always ensure each module seeds its permissions and fields. For Projects and Tasks, seeds already handle this; when adding new modules, include permissions + module_fields in the module seed.
- For a new dynamic module implemented according to the rules above, you should only need to run **that module’s seed** (or `npm run seed`) to insert:
  - module access permissions
  - data-level permissions (CRUD + any extra from the prompt)
  - `module_fields` and their related permissions
  No manual database edits should be required.
- Project registration is case-insensitive for module code (projects/PROJECTS) and uses permissionSchema.moduleFields.
- Tasks seed uses module.config.json for permissions and inserts baseline task fields into module_fields.
- When running `npm run seed`, duplicate permission codes are deduped; avoid custom duplicates in module seeds.
- When creating a new dynamic module (e.g. Notes), always wire its module-specific seed (if it exists under `src/modules/[module]/seeds/seed.ts`) into the main `scripts/seed.ts` flow so `npm run seed` automatically runs that module’s seed without additional prompts.
- **IMPORTANT – module_fields + field permissions must attach to the canonical module row**:
  - Dynamic modules discovered in `scripts/seed.ts` use `module.config.json.id.toUpperCase()` as the `modules.code` value (e.g. `notes` → `NOTES`). When seeding `module_fields` (and any default `role_field_permissions`), always resolve the module row by this canonical code (case-insensitive) and **never insert a second module row** for the same feature.
  - If `module_fields` point to the wrong `moduleId`, the Role Management UI will show “No fields available for this module”. Always verify `module_fields.moduleId` matches the module row selected in Role Management before shipping a new module.






# Cursor Rules for RAD Framework

## Project Overview
Rapid Application Development framework using Next.js, Zustand, PostgreSQL, Drizzle ORM, TailwindCSS, ShadCN, Zod. Modular architecture with auto-discovery modules.

## Core Structure - NEVER CHANGE
src/
├── core/ # Shared components, hooks, middleware, stores
├── modules/ # Plug-and-play feature modules
├── app/ # Next.js App Router


- Follow exact folder structure from project root
- Modules go ONLY in `src/modules/`
- Core utilities ONLY in `src/core/`

## Module Template - Use for ALL New Modules
modules/[module-name]/
├── module.config.json # REQUIRED manifest
├── api/
│ ├── endpoints.ts # Zod input/output schemas
│ └── handlers/ # .ts files (list.ts, create.ts, etc)
├── components/ # Module-specific UI
├── routes/ # .tsx pages (index.tsx, new.tsx, [id].tsx)
├── services/ # Business logic
├── store/
│ ├── store.config.json # REQUIRED store manifest
│ └── [module]Store.ts
├── schemas/ # DB schema + Zod validation
├── types/ # Module types
└── index.ts # Exports



## File Naming Conventions
✅ GOOD

api/handlers/list.ts

api/handlers/create.ts

routes/index.tsx (homepage)

routes/new.tsx

routes/[id].tsx

store/notesStore.ts

❌ BAD

api/list.handler.ts

pages/home.tsx

components/HomePage.tsx

Notes.store.ts



## Code Standards
### 1. NO Generated Documentation
// ❌ NEVER DO THIS
/**

Creates a new note

@param data - Note data

@returns Created note
*/

// ✅ DO THIS - Self-documenting code
export const createNote = async (data: NoteInput, userId: number) => {
return db.insert(notes).values({ ...data, userId }).returning();
};



### 2. Minimal Comments Only
// ✅ GOOD - Explains WHY, not WHAT
// Cache results to avoid N+1 queries
const notesWithUser = await db
.select()
.from(notes)
.leftJoin(users, eq(notes.userId, users.id));

// ❌ BAD - Explains obvious WHAT
const notes = await db.select().from(notes); // Get all notes



### 3. Use Core Hooks & Utilities
// ✅ ALWAYS use these
import { useModuleStore } from '@/core/hooks/useStore';
import { middlewareRegistry } from '@/core/middleware';
import { moduleLoader } from '@/core/lib/moduleLoader';

// ❌ NEVER create custom versions
const useNotesStore = create(...) // Use useModuleStore('notes') instead



### 4. Module Config Format
{
"id": "notes",
"name": "Notes",
"enabled": true,
"routes": [
{ "path": "/notes", "file": "index.tsx" },
{ "path": "/notes/new", "file": "new.tsx" }
],
"api": {
"prefix": "/api/notes",
"endpoints": [
{
"method": "GET",
"path": "/",
"handler": "list",
"middleware": ["auth", "permission:notes.read"]
}
]
}
}



### 5. Store Pattern
// ✅ Follow this EXACT pattern
export const createNotesStore = () => {
return createModuleStore<NotesStore>('notes', (set, get) => ({
notes: [],
loading: false,
setNotes: (notes) => set({ notes }),
// ... actions
}));
};



## NEVER Modify Core Files
❌ DO NOT TOUCH:

src/core/*

src/app/api/[...path]/route.ts

src/app/(dashboard)/[...slug]/page.tsx

src/middleware.ts

✅ ONLY EDIT:

src/modules/[your-module]/*

Your module.config.json



## ShadCN Usage
// ✅ Use shadcn/ui components ONLY
import { Button, Input, Card } from '@/core/components/ui';

// ❌ Never use raw Tailwind or other UI libs
// <div className="bg-blue-500 p-4">...</div> // Use Card instead
- When implementing a new module:
  - **Before importing a UI primitive** (e.g. `Checkbox`), verify it exists in `src/core/components/ui`.
  - If it does **not** exist and is truly needed, first create it in `src/core/components/ui` following the same pattern as `button.tsx` / `input.tsx` (ShadCN-style, using `cn` and design tokens), then import it from there.
  - After adding a new core UI component, **update the module code to import that component instead of inlining ad-hoc markup**, and run `npm run lint` so `Module not found`, `is not defined`, and similar runtime/reference errors are caught before shipping.
  - **Never wrap a button-like core component (e.g. `Checkbox` which renders a `<button>`) inside another `<button>`**; use a `div`/`label` wrapper instead to avoid `<button> inside <button>` hydration errors.

## Toasts (Sonner)
- Always use the shared Sonner `toast` utilities for user feedback (success, error, warning, info) instead of `alert`, `confirm`, or custom toast implementations.
- For permission-denied, validation, and API error cases, show a clear `toast.error(...)` message; for successful CRUD actions, show `toast.success(...)`.
- Ensure each significant user action (create, update, delete, import, export, status change) triggers an appropriate toast so the user always gets feedback.

### ABSOLUTE RULES FOR USER FEEDBACK
- **Never use native `window.alert`, `window.confirm`, or `window.prompt` anywhere in the codebase.**
- **Always** use:
  - `toast.error` / `toast.success` / `toast.warning` / `toast.info` for notifications.
  - ShadCN `Dialog` (from `src/core/components/ui/dialog`) or other in-app UI for confirmations (e.g. delete, destructive actions).
- Validation messages must be **specific and human-friendly**:
  - Prefer messages like `"Title is required"` over generic `"Validation failed"`.
  - When backend sends validation `details`, surface at least the first meaningful message in the toast (title + optional description).

## Database Schema Pattern
// ✅ Module-specific schemas in schemas/
import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  // ... fields
});

## Permissions
// ✅ Use core permissions
import { Permission } from '@/core/lib/permissions';

middleware: ["auth", "permission:notes.create"]
Quick Commands (Use these exactly)

npm run generate:module notes      # Create new module
npm run dev                       # Development server
npm run seed                      # Seed database
npm run validate:modules          # Check module structure
Emergency Disable Module

// In module.config.json
{
  "enabled": false
}
Type Safety Rules
Always export types from types/index.ts

Use z.infer<typeof schema> for API payloads

Never use any - use unknown instead

Performance Rules
Use useTransition() for optimistic updates

Server Components for data fetching when possible

Memoize expensive computations with useMemo

# Dynamic Custom Fields System

## Overview
The framework supports dynamic custom fields for modules that have `"custom_field": true` in their `module.config.json`. Custom fields are stored in the `custom_fields` JSONB column and managed through the Settings → Custom Fields UI.

## Enabling Custom Fields for a Module
Add `"custom_field": true` to the module's `module.config.json`:
```json
{
  "id": "projects",
  "name": "Projects",
  "custom_field": true,
  ...
}
```

- When `"custom_field": true` is set:
  - The module will automatically appear in **Settings → Custom Fields** in the **“Belongs to”** dropdown (no extra UI changes required).
  - The Custom Fields API will treat it as eligible for runtime field creation.
  - You **must** ensure the module:
    - Has a `custom_fields` JSONB column in its table/schema.
    - Registers baseline `module_fields` + `role_field_permissions` via its module seed/registration, similar to Projects/Tasks/Notes/Students.

## Custom Fields Management
- Custom fields are created/managed from Settings → Custom Fields page
- Fields are automatically registered in `module_fields` table
- Field permissions are automatically created for all roles (default: visible=true, editable=false for non-admins)
- Fields can be configured with: name, code, type, required, default value, show in table, filterable
- Field types supported: text, number, email, date, select, textarea, boolean, url

## Using Custom Fields in Module Code

### Getting Custom Fields with Permissions
```typescript
import { getModuleCustomFields } from '@/core/lib/services/moduleCustomFieldsService';
import { getCurrentUserRole } from '@/core/lib/permissions';

// In API handler or service
const roleId = await getCurrentUserRole(userId);
const customFields = await getModuleCustomFields('projects', roleId);

// Filter to only visible fields
const visibleFields = customFields.filter(f => f.isVisible);
```

### Validating Custom Field Values
```typescript
import { validateCustomFields } from '@/core/lib/services/moduleCustomFieldsService';

const validation = validateCustomFields(
  { client_email: 'test@example.com', budget: 1000 },
  customFields
);

if (!validation.valid) {
  // Handle errors
  Object.entries(validation.errors).forEach(([field, error]) => {
    toast.error(error);
  });
}
```

### Storing Custom Fields
Custom fields are stored in the `custom_fields` JSONB column:
```typescript
// In create/update handlers
const project = await db.insert(projects).values({
  ...otherFields,
  customFields: {
    client_email: input.client_email,
    budget: input.budget,
    // ... other custom fields
  },
});
```

### Filtering by Custom Fields
```typescript
import { buildCustomFieldFilter, buildCustomFieldQueryCondition } from '@/core/lib/services/moduleCustomFieldsService';

// Build filters from query params
const filters = buildCustomFieldFilter(queryParams, customFields);

// Apply to query (simplified - may need raw SQL for complex JSONB queries)
if (filters.length > 0) {
  // Use JSONB operators in WHERE clause
  // Example: WHERE custom_fields->>'client_email' = 'test@example.com'
}
```

### Rendering Custom Fields in UI
```typescript
// In form components
{customFields
  .filter(f => f.isVisible)
  .map(field => (
    <FormField
      key={field.id}
      name={field.code}
      label={field.label}
      disabled={!field.isEditable}
      required={field.metadata?.isRequired}
      // ... render based on field.fieldType
    />
  ))}
```

## System Fields vs Custom Fields (CRITICAL)

### Understanding the Distinction
Every module has TWO types of fields:

1. **System Fields (Default/Core Fields)** - `is_system_field = true`
   - Created during module seeding/registration
   - Part of the core module schema (e.g., Roll Number, Full Name, Email for Students)
   - **CANNOT** be edited, renamed, or deleted by users
   - **MUST NOT** appear on the Custom Fields settings page
   - **MUST** be marked with `isSystemField: true` when registering

2. **Custom Fields (User-Created Fields)** - `is_system_field = false`
   - Created by users via Settings → Custom Fields UI
   - Dynamic, extensible fields stored in JSONB
   - **CAN** be edited, deleted by users with proper permissions
   - **MUST** appear on the Custom Fields settings page
   - **MUST** be marked with `isSystemField: false` when creating

### Registering System Fields Correctly

When seeding/registering a module's default fields, **ALWAYS** mark them as system fields:

```typescript
// ✅ CORRECT - Mark default fields as system fields
await db.insert(moduleFields).values({
  moduleId,
  name: 'Roll Number',
  code: 'rollNumber',
  label: 'Roll Number',
  fieldType: 'text',
  description: 'Student roll number',
  isSystemField: true,  // ← CRITICAL: Mark as system field
  isActive: true,
  sortOrder: 1,
  createdBy: userId,
  updatedBy: userId,
});

// ❌ WRONG - Missing isSystemField flag
await db.insert(moduleFields).values({
  moduleId,
  name: 'Roll Number',
  code: 'rollNumber',
  // ... missing isSystemField: true
});
```

### Database Schema Requirements

The `module_fields` table includes:
```sql
CREATE TABLE module_fields (
  id UUID PRIMARY KEY,
  module_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  label VARCHAR(255),
  field_type VARCHAR(50),
  description TEXT,
  is_system_field BOOLEAN NOT NULL DEFAULT false,  -- ← Key distinction
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(module_id, code)
);
```

## Implementing Custom Fields in New Modules (Complete Guide)

### Step 1: Enable Custom Fields in Module Config

```json
// module.config.json
{
  "id": "students",
  "name": "Students",
  "custom_field": true,  // ← Enable custom fields
  ...
}
```

### Step 2: Ensure JSONB Column in Schema

```typescript
// schemas/[module]Schema.ts
export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  // ... system fields (rollNumber, fullName, etc.)
  customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({}),  // ← Required
  createdAt: timestamp('created_at').defaultNow().notNull(),
  // ...
});
```

### Step 3: Register System Fields with isSystemField Flag

```typescript
// utils/moduleRegistration.ts OR seeds/seed.ts
export async function registerStudentFields(moduleId: string, userId?: string) {
  const SYSTEM_FIELDS = [
    { name: 'Roll Number', code: 'rollNumber', fieldType: 'text', sortOrder: 1 },
    { name: 'Full Name', code: 'fullName', fieldType: 'text', sortOrder: 2 },
    { name: 'Email', code: 'email', fieldType: 'email', sortOrder: 3 },
    // ... more system fields
  ];

  for (const field of SYSTEM_FIELDS) {
    const existing = await db.select().from(moduleFields)
      .where(and(
        eq(moduleFields.moduleId, moduleId),
        eq(moduleFields.code, field.code)
      )).limit(1);

    if (existing.length === 0) {
      await db.insert(moduleFields).values({
        moduleId,
        name: field.name,
        code: field.code,
        label: field.name,
        fieldType: field.fieldType,
        description: field.name,
        isSystemField: true,  // ← CRITICAL: Always true for default fields
        isActive: true,
        sortOrder: field.sortOrder,
        createdBy: userId,
        updatedBy: userId,
      });
    }
  }
}
```

### Step 4: Create Custom Fields Hook

Create a hook to fetch custom fields for your module:

```typescript
// hooks/use[Module]CustomFields.ts
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/core/store/authStore';

export interface CustomFieldDefinition {
  id: string;
  moduleId: string;
  name: string;
  code: string;
  label: string;
  fieldType: 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea' | 'boolean' | 'url';
  description?: string;
  isActive: boolean;
  sortOrder: number;
  metadata?: {
    isRequired?: boolean;
    defaultValue?: string | number | boolean | null;
    showInTable?: boolean;
    isFilterable?: boolean;
    options?: string[]; // For select fields
  };
}

export function useStudentCustomFields() {
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;

    const fetchCustomFields = async () => {
      setLoading(true);
      try {
        // Get module ID
        const modulesRes = await fetch('/api/modules', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const modulesData = await modulesRes.json();
        const studentsModule = modulesData.modules?.find(
          (m: any) => m.code === 'STUDENTS' || m.code === 'students'
        );

        if (!studentsModule) return;

        // Fetch ONLY custom fields (isSystemField = false)
        const res = await fetch(
          `/api/settings/custom-fields?moduleId=${studentsModule.id}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const data = await res.json();
        if (data.success) {
          setCustomFields(data.data);
        }
      } catch (error) {
        console.error('Error fetching custom fields:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomFields();
  }, [accessToken]);

  return { customFields, loading };
}
```

### Step 5: Update Form Component to Render Custom Fields

```typescript
// components/[Module]Form.tsx
import { useStudentCustomFields } from '../hooks/useStudentCustomFields';

export function StudentsForm({ form, onChange }: StudentsFormProps) {
  const { customFields } = useStudentCustomFields();

  const updateCustomField = (fieldCode: string, value: any) => {
    onChange({
      ...form,
      customFields: {
        ...(form.customFields ?? {}),
        [fieldCode]: value,
      },
    });
  };

  const renderCustomField = (field: CustomFieldDefinition) => {
    const value = form.customFields?.[field.code] ?? '';
    const isRequired = field.metadata?.isRequired ?? false;

    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <Input
            type={field.fieldType}
            value={value as string}
            onChange={(e) => updateCustomField(field.code, e.target.value)}
            placeholder={field.label}
            required={isRequired}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value as string}
            onChange={(e) => updateCustomField(field.code, e.target.value)}
            required={isRequired}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value as string}
            onChange={(e) => updateCustomField(field.code, e.target.value)}
            required={isRequired}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value as string}
            onChange={(e) => updateCustomField(field.code, e.target.value)}
            rows={3}
            required={isRequired}
          />
        );
      
      case 'select':
        const options = field.metadata?.options?.map((opt: string) => ({
          value: opt,
          label: opt,
        })) ?? [];
        return (
          <Select
            value={value as string}
            onChange={(e) => updateCustomField(field.code, e.target.value)}
            options={options}
            required={isRequired}
          />
        );
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => updateCustomField(field.code, e.target.checked)}
              className="rounded border-gray-300"
            />
          </div>
        );
      
      default:
        return (
          <Input
            value={value as string}
            onChange={(e) => updateCustomField(field.code, e.target.value)}
            required={isRequired}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* System Fields - Hardcoded */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Roll Number</Label>
          <Input
            value={form.rollNumber}
            onChange={(e) => onChange({ ...form, rollNumber: e.target.value })}
          />
        </div>
        <div>
          <Label>Full Name</Label>
          <Input
            value={form.fullName}
            onChange={(e) => onChange({ ...form, fullName: e.target.value })}
          />
        </div>
        {/* ... more system fields */}
      </div>

      {/* Dynamic Custom Fields - Rendered from API */}
      {customFields.length > 0 && (
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Custom Fields</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customFields.map((field) => (
              <div key={field.id}>
                <Label>
                  {field.label}
                  {field.metadata?.isRequired && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </Label>
                {renderCustomField(field)}
                {field.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {field.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Step 6: Save Custom Fields in API Handlers

```typescript
// api/handlers/create.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const student = await db.insert(students).values({
    tenantId,
    rollNumber: body.rollNumber,
    fullName: body.fullName,
    email: body.email,
    // ... other system fields
    customFields: body.customFields ?? {},  // ← Store custom field values
    createdBy: userId,
    updatedBy: userId,
  }).returning();
  
  return NextResponse.json(student);
}
```

## Custom Fields Service API

The framework provides these services for working with custom fields:

### Get Custom Fields for Module
```typescript
// Fetches ONLY custom fields (isSystemField = false)
GET /api/settings/custom-fields?moduleId={moduleId}
```

### Create Custom Field
```typescript
POST /api/settings/custom-fields
{
  "moduleId": "uuid",
  "name": "Student Grade",
  "code": "student_grade",
  "fieldType": "number",
  "label": "Student Grade",
  "description": "Student's grade percentage",
  "metadata": {
    "isRequired": true,
    "showInTable": true,
    "isFilterable": true
  }
}
```

## Custom Fields Checklist for New Modules

When creating a new dynamic module with custom fields support:

- [ ] Add `"custom_field": true` to `module.config.json`
- [ ] Include `customFields` JSONB column in schema
- [ ] Register system fields with `isSystemField: true` in seed/registration
- [ ] Create custom fields hook (`use[Module]CustomFields`)
- [ ] Update form component to fetch and render custom fields
- [ ] Handle custom field values in create/update API handlers
- [ ] Add custom field support to list views if needed
- [ ] Test that system fields DON'T appear in Custom Fields settings
- [ ] Test that custom fields DO appear in forms dynamically

## Important Notes
- Custom fields are stored in JSONB, not as separate columns
- Field permissions are managed through Role Management UI
- Custom fields appear automatically in Role Management for field-level permissions
- Only modules with `custom_field: true` support dynamic custom fields
- Field codes must be unique per module and follow naming rules (alphanumeric + underscores)
- **System fields must NEVER appear on the Custom Fields settings page**
- **Always use `isSystemField: true` when registering default/core fields**
- **Custom fields service automatically filters out system fields** (`isSystemField = false`)

# Custom Fields Advanced Features (ESSENTIAL)

## Cache Invalidation System

### Overview
Custom fields use a centralized Zustand store for cache management to ensure changes made in Settings → Custom Fields immediately reflect in all module forms and tables without requiring page refreshes.

### Cache Store Implementation

**Location:** `src/core/store/customFieldsStore.ts`

```typescript
import { create } from 'zustand';

export interface CustomFieldDefinition {
  id: string;
  moduleId: string;
  name: string;
  code: string;
  label: string;
  fieldType: 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea' | 'boolean' | 'url';
  description?: string;
  isActive: boolean;
  sortOrder: number;
  metadata?: {
    isRequired?: boolean;
    defaultValue?: string | number | boolean | null;
    showInTable?: boolean;
    isFilterable?: boolean;
    options?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

interface CustomFieldsStore {
  // Cache for custom fields by module code
  customFieldsCache: Record<string, CustomFieldDefinition[]>;
  // Loading states by module code
  loadingStates: Record<string, boolean>;
  // Last fetch time by module code
  lastFetch: Record<string, number>;
  
  // Actions
  setCustomFields: (moduleCode: string, fields: CustomFieldDefinition[]) => void;
  getCustomFields: (moduleCode: string) => CustomFieldDefinition[] | null;
  setLoading: (moduleCode: string, loading: boolean) => void;
  isLoading: (moduleCode: string) => boolean;
  invalidateCache: (moduleCode?: string) => void;
  shouldRefetch: (moduleCode: string, ttl?: number) => boolean;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export const useCustomFieldsStore = create<CustomFieldsStore>((set, get) => ({
  customFieldsCache: {},
  loadingStates: {},
  lastFetch: {},

  setCustomFields: (moduleCode: string, fields: CustomFieldDefinition[]) => {
    set((state) => ({
      customFieldsCache: {
        ...state.customFieldsCache,
        [moduleCode]: fields,
      },
      lastFetch: {
        ...state.lastFetch,
        [moduleCode]: Date.now(),
      },
    }));
  },

  getCustomFields: (moduleCode: string) => {
    return get().customFieldsCache[moduleCode] || null;
  },

  setLoading: (moduleCode: string, loading: boolean) => {
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [moduleCode]: loading,
      },
    }));
  },

  isLoading: (moduleCode: string) => {
    return get().loadingStates[moduleCode] || false;
  },

  invalidateCache: (moduleCode?: string) => {
    if (moduleCode) {
      // Invalidate specific module
      set((state) => {
        const newCache = { ...state.customFieldsCache };
        const newLastFetch = { ...state.lastFetch };
        delete newCache[moduleCode];
        delete newLastFetch[moduleCode];
        return {
          customFieldsCache: newCache,
          lastFetch: newLastFetch,
        };
      });
    } else {
      // Invalidate all caches
      set({
        customFieldsCache: {},
        lastFetch: {},
      });
    }
  },

  shouldRefetch: (moduleCode: string, ttl: number = DEFAULT_TTL) => {
    const lastFetchTime = get().lastFetch[moduleCode];
    if (!lastFetchTime) return true;
    return Date.now() - lastFetchTime > ttl;
  },
}));
```

### Module Custom Fields Hook Pattern

**Update your module's custom fields hook to use the cache store:**

```typescript
// hooks/use[Module]CustomFields.ts
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/core/store/authStore';
import { useModules } from '@/core/hooks/useModules';
import { useCustomFieldsStore, type CustomFieldDefinition } from '@/core/store/customFieldsStore';

export type { CustomFieldDefinition };

const MODULE_CODE = 'students'; // Change to your module code

// Track ongoing fetch promises to avoid duplicate requests
let fetchPromise: Promise<CustomFieldDefinition[]> | null = null;

export function useStudentCustomFields() {
  const { accessToken } = useAuthStore();
  const { findModuleByCode, loading: modulesLoading } = useModules();
  
  const {
    getCustomFields,
    setCustomFields,
    setLoading,
    isLoading,
    shouldRefetch,
  } = useCustomFieldsStore();

  const cachedFields = getCustomFields(MODULE_CODE);
  const [customFields, setLocalFields] = useState<CustomFieldDefinition[]>(cachedFields || []);
  const loading = isLoading(MODULE_CODE);

  useEffect(() => {
    if (!accessToken || modulesLoading) return;

    // If we have valid cached data and don't need to refetch, use it
    if (cachedFields && !shouldRefetch(MODULE_CODE)) {
      setLocalFields(cachedFields);
      return;
    }

    // If a fetch is already in progress, wait for it
    if (fetchPromise) {
      fetchPromise.then((fields) => {
        setLocalFields(fields);
      });
      return;
    }

    const fetchCustomFields = async () => {
      setLoading(MODULE_CODE, true);
      try {
        // Find module
        const module = findModuleByCode(MODULE_CODE);

        if (!module) {
          console.warn(`${MODULE_CODE} module not found`);
          return [];
        }

        // Fetch custom fields
        const res = await fetch(
          `/api/settings/custom-fields?moduleId=${module.id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error('Failed to load custom fields');
        }

        const data = await res.json();
        const fields = data.success ? data.data : [];
        
        // Update cache and local state
        setCustomFields(MODULE_CODE, fields);
        setLocalFields(fields);
        
        return fields;
      } catch (error) {
        console.error('Error fetching custom fields:', error);
        return [];
      } finally {
        setLoading(MODULE_CODE, false);
        fetchPromise = null;
      }
    };

    fetchPromise = fetchCustomFields();
  }, [accessToken, modulesLoading, findModuleByCode, cachedFields, shouldRefetch, setCustomFields, setLoading]);

  // Re-sync local state when cache changes (e.g., after invalidation)
  useEffect(() => {
    if (cachedFields) {
      setLocalFields(cachedFields);
    }
  }, [cachedFields]);

  return { 
    customFields, 
    loading: loading || modulesLoading,
  };
}
```

### Invalidate Cache in Settings Page

**CRITICAL:** Always invalidate the cache after creating, updating, or deleting custom fields:

```typescript
// src/app/(dashboard)/settings/custom-fields/page.tsx
import { useCustomFieldsStore } from '@/core/store/customFieldsStore';

export default function CustomFieldsSettingsPage() {
  const { invalidateCache } = useCustomFieldsStore();

  const handleSave = async () => {
    // ... save custom field logic
    
    toast.success('Custom field created successfully');
    
    // ✅ CRITICAL: Invalidate cache to trigger refetch in forms
    invalidateCache('students'); // Use the module code
    
    setDialogOpen(false);
    resetForm();
    loadFieldsForModule(selectedModule);
  };

  const handleDelete = async (fieldId: string) => {
    // ... delete custom field logic
    
    toast.success('Custom field deleted successfully');
    
    // ✅ CRITICAL: Invalidate cache
    invalidateCache('students');
    
    loadFieldsForModule(selectedModule);
  };

  // ... rest of component
}
```

## Show in Table Feature

### Overview
Custom fields can be marked as "Show in Table" to automatically appear as columns in the module's data table. This is controlled by the `metadata.showInTable` boolean flag.

### Database Structure
```typescript
// Custom field metadata
{
  isRequired: boolean;
  showInTable: boolean;  // ← Controls table visibility
  isFilterable: boolean;
  options?: string[];
}
```

### Settings Page Implementation

**Display "Show in Table" column:**

```typescript
// Settings → Custom Fields page
<TableHeader>
  <TableRow>
    <TableHead>NAME</TableHead>
    <TableHead>BELONGS TO</TableHead>
    <TableHead>TYPE</TableHead>
    <TableHead>REQUIRED</TableHead>
    <TableHead>SHOW IN TABLE</TableHead>  {/* ← Add this column */}
    <TableHead className="text-right">ACTIONS</TableHead>
  </TableRow>
</TableHeader>
<TableBody>
  {currentFields.map((field) => (
    <TableRow key={field.id}>
      {/* ... other cells */}
      <TableCell>
        {field.metadata?.showInTable ? (
          <Badge variant="default" className="bg-blue-500">
            Yes
          </Badge>
        ) : (
          <span className="text-muted-foreground">No</span>
        )}
      </TableCell>
      {/* ... actions */}
    </TableRow>
  ))}
</TableBody>
```

### Dynamic Table Columns

**Update your module's table component to render dynamic columns:**

```typescript
// components/[Module]Table.tsx
import { useStudentCustomFields } from '../hooks/useStudentCustomFields';

export function StudentsTable({ students, /* ... */ }: StudentsTableProps) {
  const { customFields } = useStudentCustomFields();
  
  // ✅ Filter custom fields that should be shown in table
  const tableCustomFields = customFields.filter(field => field.metadata?.showInTable);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {/* System columns */}
          <TableHead>Roll #</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          {/* ... other system columns */}
          
          {/* ✅ Dynamic custom field columns */}
          {tableCustomFields.map((field) => (
            <TableHead key={field.id}>{field.label}</TableHead>
          ))}
          
          {showActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id}>
            {/* System column values */}
            <TableCell>{student.rollNumber}</TableCell>
            <TableCell>{student.fullName}</TableCell>
            <TableCell>{student.email}</TableCell>
            {/* ... other system values */}
            
            {/* ✅ Dynamic custom field values */}
            {tableCustomFields.map((field) => {
              const value = student.customFields?.[field.code];
              let displayValue = value ?? '-';
              
              // Format value based on field type
              if (value !== null && value !== undefined) {
                switch (field.fieldType) {
                  case 'boolean':
                    displayValue = value ? 'Yes' : 'No';
                    break;
                  case 'date':
                    displayValue = new Date(value as string).toLocaleDateString();
                    break;
                  default:
                    displayValue = String(value);
                }
              }
              
              return (
                <TableCell key={field.id}>{displayValue}</TableCell>
              );
            })}
            
            {showActions && (
              <TableCell className="text-right">
                <TableActions /* ... */ />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Export with Custom Fields

**Update export functionality to include custom fields marked as "Show in Table":**

```typescript
const handleExport = () => {
  if (!students.length) {
    toast.info('No students to export');
    return;
  }

  const { customFields } = useStudentCustomFields();
  const exportableFields = customFields.filter(field => field.metadata?.showInTable);

  const headers = [
    'Roll Number',
    'Full Name',
    'Email',
    // ... system fields
    ...exportableFields.map(field => field.label),  // ✅ Add custom field headers
  ];
  
  const rows = students.map((s) => {
    const baseRow = [
      s.rollNumber,
      s.fullName,
      s.email,
      // ... system values
    ];
    
    // ✅ Add custom field values
    const customFieldValues = exportableFields.map(field => {
      const value = s.customFields?.[field.code];
      if (value === null || value === undefined) return '';
      if (field.fieldType === 'boolean') return value ? 'Yes' : 'No';
      if (field.fieldType === 'date') return new Date(value as string).toISOString().split('T')[0];
      return String(value);
    });
    
    return [...baseRow, ...customFieldValues];
  });

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  // ... create and download CSV
};
```

## Edit Custom Fields Feature

### Overview
Users should be able to edit existing custom fields through the Settings → Custom Fields page to update properties like name, type, required status, and "Show in Table" setting.

### Implementation

**Add Edit button to the table:**

```typescript
// Settings → Custom Fields page
import { Edit } from 'lucide-react';

// In the table actions column:
<TableCell className="text-right">
  <div className="flex items-center justify-end gap-2">
    {/* ✅ Edit button */}
    <Button
      variant="ghost"
      size="sm"
      onClick={() => openEdit(field)}
      className="hover:bg-accent"
    >
      <Edit className="h-4 w-4" />
    </Button>
    {/* Delete button */}
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleDelete(field.id)}
      className="text-destructive hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
</TableCell>
```

**Edit handler implementation:**

```typescript
const openEdit = (field: CustomField) => {
  setEditingField(field);
  setForm({
    moduleId: field.moduleId,
    name: field.name,
    code: field.code,
    label: field.label,
    fieldType: field.fieldType,
    isRequired: field.metadata?.isRequired || false,
    showInTable: field.metadata?.showInTable || false,  // ✅ Load existing value
    options: field.metadata?.options?.join(', ') || '',
  });
  setDialogOpen(true);
};

const handleSave = async () => {
  // ... validation
  
  const payload = {
    moduleId: form.moduleId,
    name: form.name.trim(),
    code: code.trim(),
    label: label,
    fieldType: form.fieldType,
    metadata: {
      isRequired: form.isRequired,
      showInTable: form.showInTable,  // ✅ Save updated value
      options: form.fieldType === 'select' 
        ? form.options.split(',').map(o => o.trim()).filter(Boolean)
        : undefined,
    },
  };

  const url = editingField
    ? `/api/settings/custom-fields/${editingField.id}`
    : '/api/settings/custom-fields';
  const method = editingField ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to save custom field');
  }

  toast.success(editingField ? 'Custom field updated successfully' : 'Custom field created successfully');
  
  // ✅ CRITICAL: Invalidate cache after editing
  invalidateCache('students');
  
  setDialogOpen(false);
  resetForm();
  loadFieldsForModule(selectedModule);
};
```

## Custom Fields Search Functionality

### Overview
Search functionality must include custom fields with **text-based types only**. Boolean and date fields should NOT be searchable as they are not text-based.

### Searchable Field Types
```typescript
const SEARCHABLE_FIELD_TYPES = [
  'text',      // ✅ Searchable
  'email',     // ✅ Searchable
  'url',       // ✅ Searchable
  'textarea',  // ✅ Searchable
  'select',    // ✅ Searchable
  'number',    // ✅ Searchable
];

const NON_SEARCHABLE_FIELD_TYPES = [
  'boolean',   // ❌ Not searchable (Yes/No toggle)
  'date',      // ❌ Not searchable (formatted date)
];
```

### Service Implementation

**Update the list service to search custom fields:**

```typescript
// services/[module]Service.ts
import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { db } from '@/core/lib/db';
import { students } from '../schemas/studentsSchema';
import { moduleFields } from '@/core/lib/db/permissionSchema';
import { modules } from '@/core/lib/db/baseSchema';

export async function listStudentsForTenant(
  tenantId: string,
  filters: StudentListFilters = {},
): Promise<Student[]> {
  const conditions = [
    eq(students.tenantId, tenantId),
    isNull(students.deletedAt),
  ];

  // ... other filters (status, course, etc.)

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    
    // ✅ Define searchable custom field types
    const searchableFieldTypes = ['text', 'email', 'url', 'textarea', 'select', 'number'];
    
    // Get the module
    const studentsModule = await db
      .select()
      .from(modules)
      .where(eq(modules.code, 'STUDENTS'))
      .limit(1);
    
    let searchConditions = [
      ilike(students.rollNumber, searchTerm),
      ilike(students.fullName, searchTerm),
      ilike(students.email, searchTerm),
      ilike(students.phone, searchTerm),
    ];
    
    // ✅ Add custom field search if module exists
    if (studentsModule.length > 0) {
      const customFields = await db
        .select()
        .from(moduleFields)
        .where(
          and(
            eq(moduleFields.moduleId, studentsModule[0].id),
            eq(moduleFields.isActive, true)
          )
        );
      
      // ✅ Filter to only searchable field types
      const searchableFields = customFields.filter(field => 
        field.fieldType && searchableFieldTypes.includes(field.fieldType)
      );
      
      // ✅ Add search conditions for each searchable custom field
      for (const field of searchableFields) {
        // Use JSONB operator to search in custom_fields
        searchConditions.push(
          sql`${students.customFields}->>${field.code} ILIKE ${searchTerm}`
        );
      }
    }
    
    // ✅ Combine all search conditions with OR
    conditions.push(or(...searchConditions));
  }

  return db
    .select()
    .from(students)
    .where(and(...conditions))
    .orderBy(desc(students.createdAt));
}
```

### Search Behavior

**What gets searched:**
- ✅ All system text fields (rollNumber, fullName, email, phone, etc.)
- ✅ Custom fields with type: text, email, url, textarea, select, number
- ❌ Custom fields with type: boolean, date
- ✅ Case-insensitive matching
- ✅ Partial matching (contains)

**Example search queries:**
```typescript
// Search: "john"
// Matches:
// - rollNumber: "JOHN-001"
// - fullName: "John Doe"
// - email: "john@example.com"
// - customFields.notes: "Excellent student named John"
// - customFields.previousSchool: "St. John's Academy"

// Does NOT match:
// - customFields.isActive: true (boolean field)
// - customFields.admissionDate: "2024-01-01" (date field)
```

## Custom Fields Checklist for New Modules

When implementing custom fields for a new module, ensure ALL of these are completed:

- [ ] Add `"custom_field": true` to `module.config.json`
- [ ] Include `customFields` JSONB column in schema
- [ ] Register system fields with `isSystemField: true` in seed/registration
- [ ] **Create cache-enabled custom fields hook using `useCustomFieldsStore`**
- [ ] Update form component to fetch and render custom fields
- [ ] Handle custom field values in create/update API handlers
- [ ] **Add dynamic columns to table component based on `showInTable`**
- [ ] **Update export functionality to include custom fields with `showInTable`**
- [ ] **Implement edit functionality in settings page**
- [ ] **Add cache invalidation after create/update/delete in settings**
- [ ] **Implement search functionality for text-based custom fields only**
- [ ] **Filter searchable field types (exclude boolean, date)**
- [ ] Test that system fields DON'T appear in Custom Fields settings
- [ ] Test that custom fields DO appear in forms dynamically
- [ ] Test that creating/editing custom fields immediately reflects in forms (cache invalidation)
- [ ] Test that toggling "Show in Table" adds/removes columns
- [ ] Test that search includes custom field values (text types only)

# Search Filter Debouncing (ESSENTIAL)

## Overview
All search inputs that trigger server-side filtering MUST implement proper debouncing to prevent excessive API calls while the user is typing. This improves performance, reduces server load, and provides a better user experience.

## Core Rules

32. **ALWAYS debounce search inputs**:
   - Every search input that triggers an API call MUST use the `useDebounce` hook
   - Standard debounce delay: **500ms** (adjustable based on use case)
   - Apply debouncing to ALL modules: Students, Projects, Tasks, Notes, and any future modules

33. **Using the useDebounce Hook**:
   ```typescript
   import { useDebounce } from '@/core/hooks/useDebounce';
   
   // ✅ CORRECT - Debounce search input
   const [search, setSearch] = useState('');
   const debouncedSearch = useDebounce(search, 500);
   
   useEffect(() => {
     fetchData();
   }, [debouncedSearch]); // Use debounced value in dependencies
   
   // ❌ WRONG - No debouncing (triggers API on every keystroke)
   const [search, setSearch] = useState('');
   useEffect(() => {
     fetchData();
   }, [search]);
   ```

34. **Implementation Pattern**:
   ```typescript
   // Module route component (e.g., routes/index.tsx)
   import { useDebounce } from '@/core/hooks/useDebounce';
   
   export default function ModulePage() {
     const [search, setSearch] = useState('');
     const [status, setStatus] = useState('');
     const debouncedSearch = useDebounce(search, 500);
     
     const fetchData = useCallback(async () => {
       const params = new URLSearchParams();
       if (debouncedSearch) params.append('search', debouncedSearch);
       if (status) params.append('status', status);
       
       const response = await fetch(`/api/module?${params}`);
       // ... handle response
     }, [debouncedSearch, status]);
     
     useEffect(() => {
       fetchData();
     }, [fetchData]);
     
     return (
       <Input
         value={search}
         onChange={(e) => setSearch(e.target.value)}
         placeholder="Search..."
       />
     );
   }
   ```

35. **When to apply debouncing**:
   - **Text search inputs**: Always debounce (500ms)
   - **Dropdown filters**: No debouncing needed (single selection)
   - **Date pickers**: No debouncing needed (single selection)
   - **Checkboxes**: No debouncing needed (immediate toggle)
   - **Multi-select with search**: Debounce the search portion (500ms)

36. **Debounce delays**:
   - **Search/text input**: 500ms (standard)
   - **Autocomplete/typeahead**: 300ms (faster response)
   - **Complex queries**: 700ms (for heavy operations)
   - **Adjust as needed** based on user feedback and performance metrics

37. **Visual feedback**:
   - Consider showing a subtle loading indicator when search is debouncing
   - Ensure the input remains responsive (no lag in typing)
   - Don't block user input during debounce period
   ```typescript
   // ✅ GOOD - Show loading state when debounced value differs from current
   const isSearching = search !== debouncedSearch;
   
   <div className="relative">
     <Input
       value={search}
       onChange={(e) => setSearch(e.target.value)}
       placeholder="Search..."
     />
     {isSearching && (
       <div className="absolute right-2 top-1/2 -translate-y-1/2">
         <Loader2 className="h-4 w-4 animate-spin" />
       </div>
     )}
   </div>
   ```

38. **Server-side filtering + Debouncing**:
   - Debouncing is CLIENT-SIDE optimization
   - Filtering/sorting remains SERVER-SIDE logic
   - Debouncing reduces the number of requests sent to the server
   - Never combine debouncing with client-side filtering (defeats the purpose)
   ```typescript
   // ✅ CORRECT - Debounce on client, filter on server
   const debouncedSearch = useDebounce(search, 500);
   
   useEffect(() => {
     fetch(`/api/data?search=${debouncedSearch}`); // Server filters
   }, [debouncedSearch]);
   
   // ❌ WRONG - Debounce + client-side filtering
   const debouncedSearch = useDebounce(search, 500);
   const filtered = data.filter(item => 
     item.name.includes(debouncedSearch)
   ); // Don't filter on client
   ```

39. **Testing debouncing**:
   - Test that API calls are NOT made on every keystroke
   - Test that API calls ARE made after debounce delay
   - Test that rapid typing doesn't cause multiple API calls
   - Test that changing filters immediately after typing works correctly

40. **Common pitfalls to avoid**:
   - ❌ Don't forget to use the debounced value in `useEffect` dependencies
   - ❌ Don't debounce non-text inputs (dropdowns, checkboxes)
   - ❌ Don't set debounce delay too high (> 1000ms feels slow)
   - ❌ Don't set debounce delay too low (< 200ms defeats the purpose)
   - ❌ Don't create custom debounce implementations (use the shared hook)

## useDebounce Hook Reference

Location: `src/core/hooks/useDebounce.ts`

```typescript
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

## Module Implementation Checklist

When implementing search functionality in ANY module:

- [ ] Import `useDebounce` from `@/core/hooks/useDebounce`
- [ ] Create state for raw search input: `const [search, setSearch] = useState('')`
- [ ] Create debounced version: `const debouncedSearch = useDebounce(search, 500)`
- [ ] Use `debouncedSearch` in API calls and `useEffect` dependencies
- [ ] Bind `search` (not `debouncedSearch`) to input `value`
- [ ] Update `setSearch` in input `onChange`
- [ ] Test that typing doesn't trigger excessive API calls
- [ ] Consider adding visual feedback during debounce period

# Complete Dynamic Module Creation Guide (ESSENTIAL)

## CRITICAL: System Fields vs Custom Fields Architecture

**UNDERSTAND THIS FIRST** - This is the foundation of all module creation:

### System Fields (Default/Core Fields)
- **Storage**: Physical database columns in the module's table schema
- **Definition**: Defined in `schemas/[module]Schema.ts` using Drizzle ORM column definitions
- **Registration**: Registered in `config/fields.config.ts` and seeded via `utils/moduleRegistration.ts`
- **Properties**:
  - Marked with `isSystemField: true` in `module_fields` table
  - Cannot be deleted, renamed, or have type changed by users
  - Always visible in Role Management for field-level permissions
  - Appear in forms, tables, and exports as standard columns
  - Examples: `rollNumber`, `fullName`, `email` in Students module

### Custom Fields (User-Created Fields)
- **Storage**: Stored in `custom_fields` JSONB column (NOT as physical database columns)
- **Definition**: Created dynamically via Settings → Custom Fields UI
- **Registration**: Automatically registered in `module_fields` table with `isSystemField: false`
- **Properties**:
  - Can be created, edited, and deleted by users with proper permissions
  - Stored as key-value pairs in JSONB: `customFields: { "field_code": "value" }`
  - Automatically appear in Role Management for field-level permissions
  - Must be explicitly enabled in `module.config.json` with `"custom_field": true`
  - Examples: User-created fields like "Guardian Name", "Previous School" in Students module

### Why This Architecture?
- **System fields** = Core business logic, always present, immutable structure
- **Custom fields** = Flexible, tenant-specific extensions without schema migrations
- **JSONB storage** = No database migrations needed, dynamic schema evolution
- **Field permissions** = Both system and custom fields support field-level RBAC

## Module Type Decision Tree

**BEFORE creating any module, decide:**

1. **Does this module need user-created custom fields?**
   - YES → Set `"custom_field": true` in `module.config.json`
   - NO → Omit `custom_field` property or set to `false`

2. **What are the core/essential fields?**
   - These become SYSTEM FIELDS (physical columns)
   - Must be defined in schema, registered in fields.config.ts
   - Cannot be removed later

3. **What fields might vary per tenant?**
   - These become CUSTOM FIELDS (JSONB storage)
   - Only if `custom_field: true` is set
   - Created via Settings UI, not code

## Step-by-Step Module Creation Process

### Phase 1: Module Configuration & Structure

1. **Create module folder structure** in `src/modules/[module-name]/`:
   - `module.config.json` - Module manifest (REQUIRED)
   - `index.ts` - Module exports
   - `api/` - API handlers and endpoints
   - `components/` - UI components
   - `routes/` - Page components
   - `schemas/` - Database schema and validation
   - `services/` - Business logic
   - `types/` - TypeScript types
   - `config/` - Field and permission configurations
   - `utils/` - Module registration utilities
   - `seeds/` - Database seeding script
   - `hooks/` - React hooks (if custom fields enabled)

2. **Define `module.config.json`**:
   - Set `id`, `name`, `enabled: true`
   - Define routes array with paths and component names
   - Define API endpoints with methods, paths, handlers
   - Set navigation properties (label, icon, path, order)
   - Define permissions object with all CRUD + extra permissions
   - **If custom fields needed**: Add `"custom_field": true`
   - **If field-level permissions needed**: Add `"fields": { "enabled": true, "configPath": "./config/fields.config.ts" }`

3. **Create database schema** in `schemas/[module]Schema.ts`:
   - Include ALL essential fields as physical columns
   - Include `customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({})` if `custom_field: true`
   - Include standard fields: `id`, `tenantId`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`, `deletedAt`
   - Add appropriate indexes for frequently queried columns
   - Add unique constraints for business rules (e.g., unique roll number per tenant)

4. **Create validation schemas** in `schemas/[module]Validation.ts`:
   - Define Zod schemas for `create` and `update` operations
   - Include validation for all system fields
   - Include `customFields: z.record(z.any()).optional()` if custom fields enabled
   - Export `Create[Module]Input` and `Update[Module]Input` types

### Phase 2: Field & Permission Registration

5. **Define system fields** in `config/fields.config.ts`:
   - Create array of field definitions with: `name`, `code`, `label`, `fieldType`, `description`, `sortOrder`
   - Field `code` MUST match the database column name exactly
   - Field `fieldType` must match supported types: `text`, `email`, `number`, `date`, `select`, `textarea`, `boolean`, `url`
   - Export as `[MODULE]_FIELDS` constant

6. **Define permissions** in `config/permissions.config.ts`:
   - Create array of permission definitions with: `code`, `name`, `action`, `description`, `isDangerous`, `requiresMfa`
   - Include all CRUD permissions: `create`, `read`, `update`, `delete`
   - Include extra permissions if needed: `import`, `export`, `duplicate`, `manage_labels`, `manage`
   - Export as `[MODULE]_PERMISSIONS` constant

7. **Create module registration utility** in `utils/moduleRegistration.ts`:
   - Function to register permissions: Insert into `permissions` table (dedupe by code)
   - Function to register system fields: Insert into `module_fields` table with `isSystemField: true` (dedupe by moduleId + code)
   - Main registration function that calls both, resolving moduleId from `modules` table by code
   - Module code resolution must be case-insensitive (check both uppercase and lowercase)

8. **Create seed script** in `seeds/seed.ts`:
   - Insert module record into `modules` table if not exists (dedupe by code)
   - Call module registration utility to register permissions and fields
   - Export as default function that accepts `db` parameter
   - Wire into main `scripts/seed.ts` so `npm run seed` includes this module

### Phase 3: Service Layer Implementation

9. **Create service file** in `services/[module]Service.ts`:
   - Implement `list[Module]sForTenant(tenantId, filters)`:
     - Apply tenant filter and soft delete filter
     - Apply status, search, and other filters from query params
     - **If custom fields enabled**: Include custom field search using JSONB operators for text-based field types only
     - Return ordered results
   - Implement `get[Module]ById(id, tenantId)`:
     - Verify tenant ownership
     - Check soft delete status
   - Implement `create[Module](data, tenantId, userId)`:
     - Map input to database schema
     - Include `customFields: data.customFields ?? {}` if custom fields enabled
     - Set `createdBy` and `updatedBy`
   - Implement `update[Module](id, tenantId, userId, data)`:
     - Verify record exists and belongs to tenant
     - Merge updates (preserve existing customFields if updating)
     - Set `updatedBy` and `updatedAt`
   - Implement `delete[Module](id, tenantId, userId)`:
     - Soft delete: Set `deletedAt` timestamp
     - Set `updatedBy` and `updatedAt`
   - **If duplicate feature needed**: Implement `duplicate[Module](id, tenantId, userId)`

### Phase 4: API Handlers Implementation

10. **Create API handlers** in `api/handlers/`:
    - `list.ts`: GET handler that calls service `list[Module]sForTenant` with query params
    - `create.ts`: POST handler that validates input, calls service `create[Module]`, returns created record
    - `getById.ts`: GET handler that calls service `get[Module]ById`, returns record or 404
    - `update.ts`: PATCH handler that validates input, calls service `update[Module]`, returns updated record
    - `delete.ts`: DELETE handler that calls service `delete[Module]`, returns success
    - **If duplicate needed**: `duplicate.ts`: POST handler that calls service `duplicate[Module]`

11. **All handlers must**:
    - Use `requireAuth()` middleware to get userId
    - Use `getUserTenantId(userId)` to get tenantId
    - Validate input using Zod schemas from validation file
    - Return consistent JSON responses: `{ success: true, data: ... }` or `{ error: "message" }`
    - Handle errors with try-catch and return 500 with error message
    - Use appropriate HTTP status codes: 200 (success), 201 (created), 400 (validation), 404 (not found), 500 (server error)

12. **Wire handlers to routes** in `api/endpoints.ts`:
    - Export endpoint definitions matching `module.config.json` API configuration
    - Reference handler files correctly

### Phase 5: UI Components Implementation

13. **Create form component** in `components/[Module]Form.tsx`:
    - Accept `form` (input state) and `onChange` callback props
    - **Use `useFieldPermissions(moduleCode)` hook** to get field visibility/editability
    - Define `STANDARD_FIELD_CONFIG` array with system field definitions
    - **If custom fields enabled**: Use `use[Module]CustomFields()` hook to fetch custom fields
    - Filter standard fields by `isFieldVisible(moduleCode, fieldCode)`
    - Filter custom fields by `isFieldVisible(moduleCode, fieldCode)`
    - Render standard fields in grid layout, checking `isFieldEditable()` for disabled state
    - Render custom fields in separate section, checking `isFieldEditable()` for disabled state
    - Handle loading states for permissions and custom fields
    - Show "No fields available" message if no visible fields

14. **Create table component** in `components/[Module]Table.tsx`:
    - Accept `[items]`, `loading`, `onEdit`, `onDelete`, `onDuplicate`, `showActions` props
    - Define `STANDARD_FIELDS` array with column definitions (code, label, render function)
    - **Use `useFieldPermissions(moduleCode)` hook** to get field visibility
    - **If custom fields enabled**: Use `use[Module]CustomFields()` hook and filter by `metadata.showInTable`
    - Filter standard fields by `isFieldVisible(moduleCode, fieldCode)`
    - Filter custom fields by `isFieldVisible(moduleCode, fieldCode) && field.metadata?.showInTable`
    - Render table headers for visible fields only
    - Render table cells with proper value formatting (handle boolean, date, null values)
    - Show loading and empty states

15. **Create route page** in `routes/index.tsx`:
    - Use `ProtectedPage` component with required permission
    - Implement state: `[items]`, `loading`, `search`, `status`, `dialogOpen`, `editingId`, `form`, `saving`
    - **Use `useDebounce(search, 300)` for search input** - CRITICAL for performance
    - Use `usePermissions()` hook to check CRUD permissions
    - **If custom fields enabled**: Preload custom fields using `use[Module]CustomFields()`
    - Implement `fetch[Module]s()` that calls API with debounced search and filters
    - Use `useEffect` with dependencies: `[debouncedSearch, status, ...otherFilters]`
    - Implement create/edit dialog with form component
    - Implement delete with confirmation (use `toast.promise`)
    - **If duplicate needed**: Implement duplicate handler
    - **If export needed**: Implement CSV export including custom fields with `showInTable: true`
    - **If import needed**: Implement CSV import dialog
    - **If labels needed**: Implement labels management UI
    - Render filter bar with search input and status/category dropdowns
    - Render table component with proper permission checks

### Phase 6: Custom Fields Integration (ONLY if `custom_field: true`)

16. **Create custom fields hook** in `hooks/use[Module]CustomFields.ts`:
    - Use `useCustomFieldsStore` from `@/core/store/customFieldsStore`
    - Use `useModules` hook to find module by code
    - Fetch custom fields from `/api/settings/custom-fields?moduleId={moduleId}`
    - Use cache store to avoid duplicate requests
    - Return `{ customFields, loading }`
    - **CRITICAL**: Module code must match `module.config.json.id` exactly

17. **Update service layer for custom field search**:
    - In `list[Module]sForTenant`, when `filters.search` is provided:
      - Get module from `modules` table by code
      - Query `module_fields` for active custom fields with searchable types: `text`, `email`, `url`, `textarea`, `select`, `number`
      - **EXCLUDE**: `boolean` and `date` types from search
      - Add JSONB search conditions: `sql`${table.customFields}->>${field.code} ILIKE ${searchTerm}``
      - Combine with system field searches using `or()` condition

18. **Update export functionality**:
    - Include custom fields with `metadata.showInTable === true` in CSV headers
    - Format custom field values: boolean → "Yes"/"No", date → ISO string, others → String
    - Handle null/undefined values as empty strings

19. **Update import functionality**:
    - Parse CSV headers to identify system fields
    - Map custom field columns if present
    - Validate and create records with both system and custom field data

### Phase 7: Field Permissions Integration

20. **Field permissions are automatic**:
    - System fields registered via seed automatically create `role_field_permissions` entries
    - Custom fields created via Settings UI automatically create `role_field_permissions` entries
    - Default permissions: `isVisible: true`, `isEditable: false` (except for SUPER_ADMIN/ADMIN roles)
    - Permissions are managed via Role Management UI - no code changes needed

21. **Components must respect field permissions**:
    - Forms: Check `isFieldVisible()` before rendering, `isFieldEditable()` for disabled state
    - Tables: Check `isFieldVisible()` before showing columns
    - Always use `useFieldPermissions(moduleCode)` hook in components
    - Show "(Read-only)" indicator for visible but non-editable fields

### Phase 8: Testing & Validation

22. **Run module seed**:
    - Execute `npm run seed` or module-specific seed
    - Verify module appears in `modules` table
    - Verify permissions appear in `permissions` table
    - Verify system fields appear in `module_fields` table with `is_system_field = true`
    - Verify default field permissions created in `role_field_permissions` table

23. **Test CRUD operations**:
    - Create record via UI - verify all visible fields work
    - Update record - verify editable fields work, read-only fields are disabled
    - Delete record - verify soft delete works
    - List records - verify filters and search work
    - Verify field-level permissions: hide fields, test read-only behavior

24. **If custom fields enabled**:
    - Create custom field via Settings → Custom Fields
    - Verify field appears in module form immediately (cache invalidation)
    - Verify field appears in Role Management for permission configuration
    - Verify field appears in table if `showInTable: true`
    - Verify custom field search works in list view
    - Verify export includes custom fields with `showInTable: true`
    - Delete custom field - verify it disappears from forms/tables

25. **Test with different roles**:
    - Test with role that has no field permissions - verify fields are hidden
    - Test with role that has read-only permissions - verify fields show but are disabled
    - Test with role that has full permissions - verify all fields work

## Reference Modules

- **Students module** (`src/modules/students/`): Complete example with custom fields enabled, field permissions, search, export, import, duplicate
- **Projects module** (`src/modules/projects/`): Example with labels, complex filters, financial fields
- **Tasks module** (`src/modules/tasks/`): Example with relationships, status workflows
- **Notes module** (`src/modules/notes/`): Simpler example, good starting point

## Common Patterns & Rules

### Naming Conventions
- Module folder: `kebab-case` (e.g., `student-records`)
- Module config id: `camelCase` (e.g., `studentRecords`)
- Database table: `snake_case` plural (e.g., `student_records`)
- Schema export: `camelCase` singular (e.g., `studentRecord`)
- Service functions: `camelCase` with verb (e.g., `createStudentRecord`)
- Component files: `PascalCase` (e.g., `StudentRecordForm.tsx`)
- Hook files: `camelCase` with `use` prefix (e.g., `useStudentRecordCustomFields.ts`)

### Field Type Mapping
- Database column types → `fieldType` in `module_fields`:
  - `varchar` → `text` or `email` or `url`
  - `text` → `textarea`
  - `integer` / `numeric` → `number`
  - `date` → `date`
  - `boolean` → `boolean`
  - `jsonb` → NOT used for system fields (only for `customFields` storage)

### Permission Code Format
- Pattern: `[module]:[action]`
- Examples: `students:create`, `students:read`, `students:update`, `students:delete`
- Wildcard: `students:*` for full access
- Extra actions: `students:import`, `students:export`, `students:duplicate`, `students:manage_labels`

### API Response Format
- Success: `{ success: true, data: ... }`
- Error: `{ error: "message", details?: ... }`
- Always use consistent format across all endpoints

### Error Handling
- Validation errors: Return 400 with specific field errors
- Not found: Return 404 with clear message
- Permission errors: Return 403 (handled by middleware)
- Server errors: Return 500 with generic message (log details server-side)

## Module Creation Checklist

Use this checklist when creating ANY new module:

**Configuration:**
- [ ] Created module folder structure
- [ ] Defined `module.config.json` with all required properties
- [ ] Set `custom_field: true` if custom fields needed
- [ ] Defined routes in `module.config.json`
- [ ] Defined API endpoints in `module.config.json`
- [ ] Defined navigation in `module.config.json`
- [ ] Defined permissions in `module.config.json`

**Database & Schema:**
- [ ] Created database schema with all system fields as columns
- [ ] Added `customFields` JSONB column if custom fields enabled
- [ ] Added standard fields: `id`, `tenantId`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`, `deletedAt`
- [ ] Added appropriate indexes
- [ ] Added unique constraints if needed
- [ ] Created validation schemas (Zod) for create/update

**Field & Permission Registration:**
- [ ] Created `config/fields.config.ts` with system field definitions
- [ ] Created `config/permissions.config.ts` with permission definitions
- [ ] Created `utils/moduleRegistration.ts` with registration functions
- [ ] Created `seeds/seed.ts` that registers module, permissions, and fields
- [ ] Wired seed into main `scripts/seed.ts`

**Service Layer:**
- [ ] Implemented `list[Module]sForTenant` with filters and search
- [ ] Implemented custom field search if custom fields enabled
- [ ] Implemented `get[Module]ById`
- [ ] Implemented `create[Module]`
- [ ] Implemented `update[Module]`
- [ ] Implemented `delete[Module]` (soft delete)
- [ ] Implemented extra operations if needed (duplicate, etc.)

**API Handlers:**
- [ ] Created `api/handlers/list.ts`
- [ ] Created `api/handlers/create.ts`
- [ ] Created `api/handlers/getById.ts`
- [ ] Created `api/handlers/update.ts`
- [ ] Created `api/handlers/delete.ts`
- [ ] Created extra handlers if needed
- [ ] All handlers use auth middleware
- [ ] All handlers validate input
- [ ] All handlers return consistent response format

**UI Components:**
- [ ] Created `components/[Module]Form.tsx` with field permission checks
- [ ] Created `components/[Module]Table.tsx` with field permission checks
- [ ] Created `routes/index.tsx` with full CRUD UI
- [ ] Implemented search with debouncing (300ms)
- [ ] Implemented filters (status, category, etc.)
- [ ] Implemented create/edit dialog
- [ ] Implemented delete with confirmation
- [ ] Implemented export if needed
- [ ] Implemented import if needed
- [ ] Implemented duplicate if needed
- [ ] All UI respects field-level permissions

**Custom Fields (if enabled):**
- [ ] Created `hooks/use[Module]CustomFields.ts`
- [ ] Updated form to render custom fields
- [ ] Updated table to show custom fields with `showInTable: true`
- [ ] Updated service search to include custom fields
- [ ] Updated export to include custom fields
- [ ] Updated import to handle custom fields
- [ ] Tested cache invalidation when custom fields are created/updated/deleted

**Testing:**
- [ ] Ran seed script successfully
- [ ] Tested create operation
- [ ] Tested update operation
- [ ] Tested delete operation
- [ ] Tested list with filters
- [ ] Tested search functionality
- [ ] Tested field-level permissions (hide/show, read-only)
- [ ] Tested custom fields if enabled
- [ ] Tested with different user roles
- [ ] Verified no linting errors