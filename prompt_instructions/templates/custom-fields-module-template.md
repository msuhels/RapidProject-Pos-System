# Custom Fields Enabled Module Template

## Purpose
This template demonstrates a module WITH custom fields support. Users can create additional fields via Settings → Custom Fields UI. System fields are immutable; custom fields are stored in JSONB.

## When to Use
- Module needs flexibility for tenant-specific requirements
- Fields may vary per tenant or use case
- Need dynamic schema without database migrations
- Examples: Students, Projects, Tasks, any entity with extensible attributes

## Key Characteristics
- `module.config.json`: MUST include `"custom_field": true`
- Schema: MUST include `customFields` JSONB column
- Components: MUST use custom fields hook, render custom fields dynamically
- Service: MUST include custom field search (text-based types only)
- Export/Import: MUST handle both system and custom fields

## Module Structure

```
src/modules/[module-name]/
├── module.config.json          # MUST have "custom_field": true
├── index.ts
├── api/
│   ├── endpoints.ts
│   └── handlers/
│       ├── list.ts
│       ├── create.ts
│       ├── getById.ts
│       ├── update.ts
│       ├── delete.ts
│       └── duplicate.ts (optional)
├── components/
│   ├── [Module]Form.tsx         # System + custom fields, useFieldPermissions + use[Module]CustomFields
│   └── [Module]Table.tsx        # System + custom fields, useFieldPermissions + use[Module]CustomFields
├── routes/
│   └── index.tsx                 # Full CRUD, export, import, duplicate
├── schemas/
│   ├── [module]Schema.ts        # MUST have customFields JSONB column
│   └── [module]Validation.ts    # MUST include customFields: z.record(z.any()).optional()
├── services/
│   └── [module]Service.ts       # MUST include custom field search
├── types/
│   └── index.ts
├── config/
│   ├── fields.config.ts         # System fields only (isSystemField: true)
│   └── permissions.config.ts
├── utils/
│   └── moduleRegistration.ts    # Registers system fields with isSystemField: true
├── seeds/
│   └── seed.ts
└── hooks/
    └── use[Module]CustomFields.ts  # REQUIRED: Fetches custom fields with cache
```

## Implementation Requirements

### module.config.json
```json
{
  "id": "[module-name]",
  "custom_field": true,  // REQUIRED
  "fields": {
    "enabled": true,
    "configPath": "./config/fields.config.ts"
  }
}
```

### Schema (schemas/[module]Schema.ts)
- MUST include: `customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({})`
- System fields as physical columns
- Indexes on frequently queried system fields

### Validation (schemas/[module]Validation.ts)
- MUST include: `customFields: z.record(z.any()).optional()`
- Validate system fields with appropriate Zod types

### Custom Fields Hook (hooks/use[Module]CustomFields.ts)
- Use `useCustomFieldsStore` for caching
- Use `useModules` to find module by code
- Fetch from `/api/settings/custom-fields?moduleId={moduleId}`
- Return `{ customFields, loading }`
- Module code MUST match `module.config.json.id`

### Form Component (components/[Module]Form.tsx)
- Use `useFieldPermissions(moduleCode)` for system fields
- Use `use[Module]CustomFields()` for custom fields
- Filter system fields by `isFieldVisible()`
- Filter custom fields by `isFieldVisible()`
- Render system fields in main section
- Render custom fields in separate "Custom Fields" section
- Check `isFieldEditable()` for disabled state on both

### Table Component (components/[Module]Table.tsx)
- Use `useFieldPermissions(moduleCode)` for system fields
- Use `use[Module]CustomFields()` for custom fields
- Filter system fields by `isFieldVisible()`
- Filter custom fields by `isFieldVisible() && field.metadata?.showInTable`
- Render columns for visible system fields
- Render columns for visible custom fields with `showInTable: true`
- Format custom field values: boolean → "Yes"/"No", date → formatted, null → "-"

### Service Layer (services/[module]Service.ts)
- In `list[Module]sForTenant`, when search is provided:
  1. Get module from `modules` table by code
  2. Query `module_fields` for active custom fields
  3. Filter to searchable types: `text`, `email`, `url`, `textarea`, `select`, `number`
  4. EXCLUDE: `boolean`, `date` types
  5. Add JSONB search: `sql`${table.customFields}->>${field.code} ILIKE ${searchTerm}``
  6. Combine with system field searches using `or()`
- In `create[Module]`: Include `customFields: data.customFields ?? {}`
- In `update[Module]`: Merge custom fields: `customFields: data.customFields ?? existing.customFields`

### Route Page (routes/index.tsx)
- Preload custom fields: `const { customFields } = use[Module]CustomFields()`
- Export: Include custom fields with `showInTable: true` in CSV
- Import: Parse and map custom field columns
- Use debounced search (300ms)

### Field Registration (utils/moduleRegistration.ts)
- System fields MUST be registered with `isSystemField: true`
- Custom fields are created via Settings UI, NOT in registration
- Registration only handles system fields

## Search Behavior

**Searchable Custom Field Types:**
- ✅ `text` - Full text search
- ✅ `email` - Email search
- ✅ `url` - URL search
- ✅ `textarea` - Full text search
- ✅ `select` - Option value search
- ✅ `number` - Numeric search

**Non-Searchable Custom Field Types:**
- ❌ `boolean` - Not text-based
- ❌ `date` - Requires date parsing, use date filters instead

## Field Permissions

- System fields: Registered with `isSystemField: true`, permissions created automatically
- Custom fields: Permissions created automatically when field is created via Settings UI
- Both appear in Role Management UI for field-level permission configuration
- Components must check `isFieldVisible()` and `isFieldEditable()` for both types

## Cache Invalidation

- When custom field is created/updated/deleted in Settings UI:
  - Call `invalidateCache(moduleCode)` from `useCustomFieldsStore`
  - This triggers refetch in all components using the hook
  - Forms and tables update immediately without page refresh

## Export/Import

**Export:**
- Include all system fields
- Include custom fields where `metadata.showInTable === true`
- Format: boolean → "Yes"/"No", date → ISO string, null → ""

**Import:**
- Map CSV headers to system fields
- Map remaining columns to custom fields (if field exists)
- Validate custom field values against field type
- Create records with both system and custom field data

## Reference Implementation
See: `src/modules/students/` - Complete working example matching this template exactly

