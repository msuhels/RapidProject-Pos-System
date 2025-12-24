# Cursor Rules – Dynamic Module Framework (STRICT)

> Single source of truth for generating new modules.
> Follow exactly. No assumptions. No shortcuts.

---

## 1. GLOBAL RULES (ALWAYS)

- DO NOT create documentation for changes.
- Follow the exact module folder structure.
- Use **ShadCN UI only** (`src/core/components/ui`).
- All UI must be **fully responsive**.
- Fix **all linting errors** before completion.
- Never modify `src/core/*` or framework files.

---

## 2. MODULE LOCATION & STRUCTURE (MANDATORY)

All modules live in:

```
src/modules/[module-name]/
```

Required structure:

```
module.config.json
api/
  endpoints.ts
  handlers/
    list.ts
    detail.ts
    create.ts
    update.ts
    delete.ts
routes/
  index.tsx
  new.tsx
  [id].tsx
components/
services/
schemas/
seeds/
store/
hooks/
config/
types/
utils/
index.ts
```

No deviation allowed.

---

## 3. MODULE CREATION RULES

- Wire routes correctly via `module.config.json`
- Ensure navigation visibility respects permissions
- Implement full CRUD (API + UI)
- Enforce RBAC on UI and backend
- Seed permissions, fields, and defaults

---

## 4. PERMISSIONS SYSTEM (NON-NEGOTIABLE)

All modules MUST enforce:

1. Module access
2. Data permissions (CRUD)
3. Field permissions (visibility + editability)

Rules:
- UI must hide/disable based on permissions
- Backend must reject unauthorized actions
- Never rely on UI-only checks

---

## 5. FIELD TYPES (CRITICAL)

### System Fields
- Physical DB columns
- Registered via seeds
- `isSystemField = true`
- Immutable
- NEVER appear in Custom Fields UI

### Custom Fields
- Enabled only if `"custom_field": true`
- Stored in `custom_fields` JSONB
- `isSystemField = false`
- Created via Settings → Custom Fields
- Editable & removable
- Auto-registered in permissions

---

## 6. CUSTOM FIELDS IMPLEMENTATION

Mandatory:
- Dynamic rendering in forms
- Respect field permissions
- Backend validation
- Filtering & search support

Searchable types:
```
text | email | url | textarea | select | number
```

Not searchable:
```
boolean | date
```

---

## 7. CUSTOM FIELDS CACHE (REQUIRED)

- Use `useCustomFieldsStore`
- Invalidate cache on:
  - create
  - update
  - delete
- UI must update immediately

---

## 8. SHOW IN TABLE FEATURE

- Controlled by `metadata.showInTable`
- Affects tables and exports
- Columns must update dynamically

---

## 9. FILTERS & SEARCH

Every module must include:
- Search
- Status filter
- 1–2 domain-specific filters

Rules:
- Search MUST be debounced (`useDebounce`, 500ms)
- Server-side filtering only
- Always provide “Clear Filters”

---

## 10. LABELS (IF ENABLED)

- Use core `module_labels`
- Create module-specific hook + dialog
- Permission-gated (`<module>:manage_labels`)
- Never reuse another module’s label logic directly

---

## 11. DATABASE RULES

Always include:
- `id`
- `tenant_id`
- timestamps

Foreign keys ONLY if:
- essential
- frequently queried

Use JSONB for flexible/non-filtered data.

Always index:
- `tenant_id`
- foreign keys

---

## 12. UI RULES

- Role-based rendering everywhere
- Disabled fields must look disabled
- Use Sonner `toast` for feedback
- Never use browser dialogs

---

## 13. SEEDS & REGISTRATION

Each module seed must:
- Insert permissions
- Register module_fields
- Register field permissions
- Be idempotent

Rules:
- Use canonical `modules.code` (uppercase)
- Never create duplicate module rows
- Wire module seed into global seed flow

---

## 14. REFERENCE MODULES

- Use existing modules only as patterns
- Never blindly copy
- No cross-module coupling
- Each module must stand alone

---

## 15. GOLDEN RULE

A new module must be creatable by pointing Cursor to:
- this file
- one reference module

With ZERO additional explanation.
