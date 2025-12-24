# Module Creation Quick Reference

## File Structure Template

```
src/modules/[module-name]/
├── module.config.json          # REQUIRED - Module configuration
├── index.ts                    # Module exports
├── schemas/
│   ├── [module]Schema.ts       # Database schema (Drizzle)
│   └── [module]Validation.ts   # Validation schemas (Zod)
├── types/
│   └── index.ts                # TypeScript types
├── services/
│   └── [module]Service.ts      # Business logic
├── store/
│   └── [module]Store.ts        # Zustand store
├── api/
│   └── handlers/
│       ├── list.ts             # GET /api/[module]
│       ├── create.ts           # POST /api/[module]
│       ├── getById.ts          # GET /api/[module]/:id
│       ├── update.ts           # PATCH /api/[module]/:id
│       └── delete.ts           # DELETE /api/[module]/:id
├── components/
│   ├── [Module]List.tsx
│   ├── [Module]Card.tsx
│   └── [Module]Form.tsx
└── routes/
    ├── index.tsx               # Main list page
    └── new.tsx                 # Create page
```

## module.config.json Template

```json
{
  "id": "[module-name]",
  "name": "[Module Name]",
  "version": "1.0.0",
  "description": "[Description]",
  "enabled": true,
  "routes": [
    {
      "path": "/[module]",
      "component": "index",
      "title": "[Page Title]"
    }
  ],
  "api": {
    "basePath": "/api/[module]",
    "endpoints": [
      {
        "method": "GET",
        "path": "",
        "handler": "list",
        "requiresAuth": true
      }
    ]
  },
  "navigation": {
    "label": "[Module Name]",
    "icon": "[LucideIconName]",
    "path": "/[module]",
    "order": 1
  },
  "permissions": {
    "create": "[module]:create",
    "read": "[module]:read"
  }
}
```

## Key Naming Conventions

- **Schema files:** Must end with `Schema.ts` (e.g., `activitySchema.ts`)
- **Handler files:** Match HTTP method function name (e.g., `list.ts` exports `GET`)
- **Route components:** Must have default export
- **Component files:** PascalCase (e.g., `ActivityList.tsx`)
- **Store files:** camelCase with "Store" suffix (e.g., `activityStore.ts`)

## Required Steps

1. ✅ Create folder structure
2. ✅ Create `module.config.json`
3. ✅ Create database schema (`*Schema.ts`)
4. ✅ Create validation schema
5. ✅ Create types
6. ✅ Create service layer
7. ✅ Create Zustand store
8. ✅ Create API handlers
9. ✅ Create React components
10. ✅ Create route components
11. ✅ Create `index.ts` exports
12. ✅ Run `npx drizzle-kit generate --config=drizzle.config.ts`
13. ✅ Run `npx drizzle-kit push`

## Auto-Discovery Rules

- ✅ Module folder in `src/modules/`
- ✅ Folder name doesn't start with `_`
- ✅ `module.config.json` exists
- ✅ Schema files named `*Schema.ts` in `schemas/` folder

## Common Patterns

### API Handler Pattern
```typescript
export async function GET(request: NextRequest) {
  const authMiddleware = requireAuth();
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult;
  // ... your logic
  return NextResponse.json({ success: true, data: result });
}
```

### Service Pattern
```typescript
export async function getItemsByUserId(userId: number) {
  return await db.select().from(table).where(eq(table.userId, userId));
}
```

### Store Pattern
```typescript
export const useModuleStore = create<State>()(
  persist((set) => ({ /* state */ }), { name: 'module-storage' })
);
```

## Icon Names (Lucide React)

Use PascalCase names: `FileText`, `Activity`, `Settings`, `Users`, `Calendar`, etc.
See: https://lucide.dev/icons/

## Route Parameters

For routes with `/:id`, handlers receive params via:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

## Testing Checklist

- [ ] Module appears in sidebar
- [ ] Routes are accessible
- [ ] API endpoints work
- [ ] Database table created
- [ ] CRUD operations work
- [ ] Authentication works
- [ ] Validation works


