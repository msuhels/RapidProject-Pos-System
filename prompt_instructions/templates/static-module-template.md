# Static Module Template (No Dynamic Custom Fields)

## Purpose
This template is for **non–custom-fields modules** like `notes`.  
The schema is fixed; users **cannot add or remove fields from Settings → Custom Fields**.  
You still may have helper JSONB columns (like `labelIds` or an internal `customFields`), but **they are not driven by the Custom Fields UI**.

## When to Use
- Module has a **stable, well‑defined field set**.
- No requirement for tenant‑specific runtime field creation.
- You want **simple CRUD + filters + pagination**, possibly labels or flags.
- Examples: Notes, simple audit logs, system settings, non‑extensible reference data.

> **Reference module:** `src/modules/notes`  
> This template encodes the exact patterns implemented there.

---

## Required Module Structure (Notes‑style)

Place your module under `src/modules/[module-name]/` with:

- **`module.config.json`**
  - `id`, `name`, `description`, `enabled: true`.
  - `routes`: at least `{ "path": "/[module]", "component": "index", "requiresAuth": true }`.
  - `api.basePath`: e.g. `/api/notes`.
  - `api.endpoints`: CRUD:
    - `GET ""` → `list`
    - `POST ""` → `create`
    - `GET "/:id"` → `getById`
    - `PATCH "/:id"` → `update`
    - `DELETE "/:id"` → `delete`
  - `fields` section:
    - `"enabled": true`
    - `"configPath": "./config/fields.config.ts"`
  - `"custom_field": false` (or omitted).
  - `navigation`: label/icon/path/order if you want it in the sidebar.
  - `permissions`:
    - CRUD: `[module]:create|read|update|delete`
    - Optional extras: `[module]:import`, `[module]:export`, `[module]:manage_labels`, `[module]:duplicate`, `[module]:*`.

- **`schemas/[module]Schema.ts`**
  - Standard columns:
    - `id` (UUID, PK), `tenantId` FK, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`, `deletedAt`.
  - Business columns (Notes example):
    - `title` (required text).
    - `description` (optional text).
    - `status` (`active` / `archived`).
    - `isPinned` (boolean).
  - JSONB helpers:
    - `labelIds: jsonb` for module labels.
    - Optional `customFields: jsonb` **for internal use only**, not wired to Settings → Custom Fields.
  - Indexes for tenant and frequently queried fields (e.g. status).

- **`schemas/[module]Validation.ts`**
  - `create[Module]Schema`:
    - Required fields (Notes: `title`).
    - Optional fields with sensible defaults (status, isPinned, labelIds).
    - Optional `customFields: z.record(z.any()).optional()` if you use it internally.
  - `update[Module]Schema = createSchema.partial()`.
  - Export `Create[Module]Input`, `Update[Module]Input`.

- **`services/[module]Service.ts`**
  - `list[Module]sForTenant({ tenantId, search, status, ... })`:
    - Always filter by `tenantId` and `deletedAt IS NULL`.
    - Search: typically `LIKE` over one or more text columns (Notes: `title`).
    - Filters: status (`all` sentinel), flags (Notes: `isPinned`).
    - Pagination: accept `limit`, `offset`, and return `{ items, total }`.
  - `get[Module]ById(id, tenantId)`:
    - Ensure record belongs to `tenantId` and is not soft‑deleted.
  - `create[Module]({ data, tenantId, userId })`:
    - Map `Create...Input` to `New...` insert payload.
    - Set defaults: status (`active`), booleans, arrays (e.g. `labelIds: []`).
    - Set `createdBy` and `updatedBy`.
  - `update[Module]({ id, tenantId, userId, data })`:
    - Fetch existing; return `null` if not found.
    - Build updates object with `field ?? undefined` pattern to avoid overwriting with `null` unless intentional.
    - Set `updatedBy` and `updatedAt`.
  - `delete[Module](id, tenantId, userId?)`:
    - Soft delete: set `deletedAt`, preserve or update `updatedBy`, and set `updatedAt`.

- **`api/endpoints.ts` + `api/handlers/*.ts`**
  - Handlers follow a consistent pattern:
    - `requireAuth()` → `userId`.
    - `getUserTenantId(userId)` to enforce tenancy.
    - Parse query/body.
    - Validate with Zod schemas (for create/update).
    - Call service functions.
    - Return `{ success: true, data, pagination? }` or `{ error: '...' }` with correct HTTP status.

- **`routes/index.tsx` (UI page)**
  - Wrap in `ProtectedPage` with module read permission.
  - Local state:
    - List of records, loading flag.
    - `search` input, filters (status, pinned or module‑specific), pagination state.
    - Dialog state for create/edit, form state, saving state.
    - Optional: selection set for bulk actions.
  - Fetching:
    - `useDebounce(search, 300)` and only send debounced value to API.
    - `fetch[Module]s` function builds `URLSearchParams` (search, filters, page, pageSize).
    - `useEffect` refetches on debounced search or filter changes and resets page as needed.
  - Actions:
    - `openCreate` / `openEdit` populate form and open dialog.
    - `save[Module]` decides between POST/PATCH based on `editingId`.
    - `delete[Module]` (and optional bulk delete) calls DELETE endpoint(s).
    - Optional flag toggles (like `isPinned` in Notes) use PATCH with only that flag.

- **`components/` + `hooks/`**
  - Form is often implemented inline in `routes/index.tsx` (as in Notes), but you may create a dedicated `[Module]Form.tsx`.
  - Table uses core `Table` components and `TableActions` for consistent actions.
  - If module uses labels:
    - `use[Module]Labels` hook for label CRUD.
    - `[Module]LabelsDialog` for label management.

- **`config/`, `seeds/`, `utils/`**
  - `fields.config.ts`: register system fields for Role Management (even if you don’t yet use field‑level permissions in UI).
  - `permissions.config.ts`: module permissions list.
  - `seeds/seed.ts` + `utils/moduleRegistration.ts`: register module, permissions, and fields when seeding.

---

## Behaviour & UX Requirements (mirroring Notes)

- **Search & Filters**
  - Debounced search on primary text field(s).
  - Status filter with an `"all"` option.
  - Optional flag filter (pinned/unpinned).
  - Clear Filters button that resets filters and reloads.

- **Pagination**
  - Support `page` and `pageSize` from the client, and return `total` from the API.
  - Show “Page X of Y” and “Showing A–B of N” in the UI.

- **Bulk Selection & Delete**
  - Header checkbox for “select all on current page”.
  - Row checkbox per record.
  - Bulk delete button visible only when there are selected ids and user has delete permission.

- **Labels (if module uses them)**
  - Store label IDs as JSONB array on the record.
  - Provide chips to toggle label assignment in the form dialog.
  - Provide **“Manage labels”** action only if user has `[module]:manage_labels` or `[module]:*`.

- **Permissions**
  - Use `usePermissions()` to compute:
    - `canCreate`, `canUpdate`, `canDelete`, `canManageLabels`.
  - Hide or disable buttons/actions if user lacks permission.
  - For this template, **field‑level permissions are optional**; start with module‑level permissions only.

- **Validation & Errors**
  - Enforce required fields (e.g. `title`) via Zod and display clear, human‑readable error messages via `toast.error`.
  - Prefer splitting multi‑line error messages into a short title + optional description (Notes pattern).

---

## Checklist for New Non‑Custom‑Fields Modules

- **Configuration**
  - [ ] `module.config.json` created with routes, API, navigation, permissions.
  - [ ] `custom_field` is `false` or omitted.
  - [ ] `fields.enabled` is `true` with correct `configPath`.

- **Schema & Validation**
  - [ ] Drizzle schema with system fields and any JSONB helpers needed.
  - [ ] Zod create/update schemas with proper constraints.

- **Service & API**
  - [ ] `list`, `getById`, `create`, `update`, `delete` implemented with tenant + soft‑delete checks.
  - [ ] Search and filters implemented only on system fields (no dynamic custom‑field search).
  - [ ] API handlers use auth, validation, and consistent response format.

- **UI**
  - [ ] Index page implements debounced search, filters, Clear filters, pagination.
  - [ ] Table supports selection, optional flags (like pinned), labels, and actions.
  - [ ] Dialog form covers all editable fields and respects module permissions.

- **Reference**
  - [ ] Compare with `src/modules/notes` and ensure behaviours (filters, pagination, labels, permissions) match the pattern.
