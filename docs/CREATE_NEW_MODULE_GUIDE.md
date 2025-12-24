# Quick Guide: Creating a New Module

A step-by-step guide for creating a new module in the framework. Follow these steps in order.

## Step 1: Create Folder Structure

**Where:** `src/modules/[moduleName]/`

Create these folders:
- `api/handlers/` - API route handlers
- `components/` - React UI components
- `routes/` - Page components
- `schemas/` - Database and validation schemas
- `services/` - Business logic
- `store/` - Zustand state management
- `types/` - TypeScript type definitions

## Step 2: Create Database Schema

**Where:** `src/modules/[moduleName]/schemas/[moduleName]Schema.ts`

- Define your database table using Drizzle ORM
- Export table definition and inferred types
- **Important:** File must be named `*Schema.ts` for auto-discovery

## Step 3: Create Validation Schema

**Where:** `src/modules/[moduleName]/schemas/[moduleName]Validation.ts`

- Create Zod schemas for create/update operations
- Export TypeScript types inferred from schemas

## Step 4: Create Type Definitions

**Where:** `src/modules/[moduleName]/types/index.ts`

- Re-export schema types
- Re-export validation types
- Add any extended types if needed

## Step 5: Create Service Layer

**Where:** `src/modules/[moduleName]/services/[moduleName]Service.ts`

- Implement CRUD operations (get, create, update, delete)
- Include user ownership checks where needed
- Use Drizzle ORM to interact with database

## Step 6: Create Zustand Store

**Where:** `src/modules/[moduleName]/store/[moduleName]Store.ts`

- Define state interface (data, loading, error)
- Create store with actions (set, add, update, remove)
- Configure persistence if needed

## Step 7: Create API Handlers

**Where:** `src/modules/[moduleName]/api/handlers/`

Create handler files for each endpoint:
- `list.ts` - GET handler for listing items
- `create.ts` - POST handler for creating items
- `getById.ts` - GET handler for single item
- `update.ts` - PATCH handler for updating items
- `delete.ts` - DELETE handler for deleting items

Each handler must:
- Export named function matching HTTP method (GET, POST, PATCH, DELETE)
- Use authentication middleware
- Use validation middleware for POST/PATCH
- Call service functions
- Return proper HTTP responses

## Step 8: Create Module Configuration

**Where:** `src/modules/[moduleName]/module.config.json`

Configure:
- Module metadata (id, name, version, description)
- Routes array (path, component name, title)
- API endpoints (method, path, handler name, auth requirement)
- Navigation (label, icon, path, order)
- Permissions (create, read, update, delete)

**Important:** Module `id` must match folder name.

## Step 9: Create React Components

**Where:** `src/modules/[moduleName]/components/`

Create reusable UI components:
- List component - displays collection of items
- Card component - displays single item
- Form component - handles create/update forms

Components should:
- Use the module store
- Call API endpoints
- Handle loading and error states

## Step 10: Create Route Components

**Where:** `src/modules/[moduleName]/routes/`

Create page components:
- `index.tsx` - Main list page (default export required)
- `new.tsx` - Create page (if needed)
- Other route pages as defined in config

Route components should:
- Use components from `components/` folder
- Handle navigation
- Integrate with store

## Step 11: Create Module Index File

**Where:** `src/modules/[moduleName]/index.ts`

- Export all types, schemas, stores, services, and components
- Provides clean public API for the module

## Step 12: Generate Database Migration

**Commands:**
```bash
npx drizzle-kit generate --config=drizzle.config.ts
npx drizzle-kit push
```

**Important:** Schema file must be named `*Schema.ts` in `schemas/` folder for auto-discovery.

---

## Step 13: Create Seed File (Optional)

**Where:** `src/modules/[moduleName]/seeds/seed.ts`

Create a seed file to populate demo/test data:

- Export default async function that receives `db` parameter
- Check for existing data before seeding
- Use demo users from core seed
- Provide clear logging

**Example:**
```typescript
import { yourTable } from '../schemas/yourSchema';
import { users } from '@/core/lib/db/baseSchema';
import { eq } from 'drizzle-orm';

export default async function seedYourModule(db: any) {
  // Get demo user
  const demoUsers = await db.select().from(users)
    .where(eq(users.email, 'user@example.com')).limit(1);
  
  if (demoUsers.length === 0) return;
  
  // Check if data exists
  const existing = await db.select().from(yourTable).limit(1);
  if (existing.length > 0) return;
  
  // Insert demo data
  await db.insert(yourTable).values({
    // your data
  });
}
```

**Run seeds:**
```bash
npm run seed
```

See `src/core/lib/SEEDING_GUIDE.md` for detailed guide.

## Step 14: Verify Module Registration

**Check:**
- Browser console for module loaded message
- Sidebar navigation appears automatically
- Routes work at configured paths
- API endpoints respond correctly

## Auto-Discovery System

The framework automatically:
1. Scans `src/modules/` for module directories
2. Loads `module.config.json` from each module
3. Registers routes, API endpoints, and navigation
4. Dynamically routes requests to handlers

## Key Requirements

- **Schema naming:** Must be `*Schema.ts` in `schemas/` folder
- **Config file:** Must be `module.config.json` in module root
- **Module ID:** Must match folder name
- **Route components:** Must have default export
- **API handlers:** Must export named function matching HTTP method

## Troubleshooting

**Module not in sidebar:**
- Check `module.config.json` has `navigation` section
- Verify folder name matches module `id`

**Routes not working:**
- Verify component exists in `routes/` folder
- Check component name matches config
- Ensure default export exists

**API endpoints 404:**
- Check handler file exists in `api/handlers/`
- Verify handler exports correct HTTP method function
- Check `basePath` and `path` in config

**Database errors:**
- Ensure migration was generated and applied
- Check schema file naming (`*Schema.ts`)
- Verify database connection string
