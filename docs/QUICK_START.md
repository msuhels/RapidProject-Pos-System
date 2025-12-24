# Quick Start Guide

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your PostgreSQL connection string.

3. **Initialize database:**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Creating a New Module

### Step 1: Copy Template
```bash
cp -r src/modules/_template src/modules/your-module-name
```

### Step 2: Update Module Configuration
Edit `src/modules/your-module-name/module.config.json`:

```json
{
  "id": "your-module-name",
  "name": "Your Module Name",
  "version": "1.0.0",
  "description": "Module description",
  "enabled": true,
  "icon": "IconName",
  "navigation": {
    "label": "Your Module",
    "order": 20,
    "href": "/your-module"
  },
  "routes": [
    {
      "path": "/your-module",
      "file": "index.tsx",
      "title": "Your Module Page"
    }
  ],
  "api": {
    "prefix": "/api/your-module",
    "endpoints": [
      {
        "method": "GET",
        "path": "/",
        "handler": "list",
        "public": false
      }
    ]
  },
  "permissions": ["your-module.read"],
  "dependencies": []
}
```

### Step 3: Define API Endpoints
Edit `src/modules/your-module-name/api/endpoints.ts`:

```typescript
import { z } from 'zod';
import { ApiEndpoint } from '@/core/types/module';

export const yourModuleEndpoints = {
  list: {
    method: 'GET',
    path: '/',
    input: z.object({
      page: z.number().optional(),
    }),
    output: z.object({
      data: z.array(z.any()),
    }),
  },
} satisfies Record<string, ApiEndpoint>;
```

### Step 4: Create API Handlers
Create handlers in `src/modules/your-module-name/api/handlers/`:

- `list.ts` - GET handler
- `create.ts` - POST handler
- `update.ts` - PATCH handler
- `delete.ts` - DELETE handler

### Step 5: Create Database Schema
Edit `src/modules/your-module-name/schemas/yourModuleSchema.ts`:

```typescript
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const yourModuleTable = pgTable('your_module', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Step 6: Create Validation Schema
Edit `src/modules/your-module-name/schemas/yourModuleValidation.ts`:

```typescript
import { z } from 'zod';

export const yourModuleSchema = z.object({
  name: z.string().min(1),
});
```

### Step 7: Create Service
Edit `src/modules/your-module-name/services/yourModuleService.ts`:

```typescript
import { db } from '@/core/lib/db';
import { yourModuleTable } from '../schemas/yourModuleSchema';

export class YourModuleService {
  async getAll() {
    return await db.select().from(yourModuleTable);
  }
}

export const yourModuleService = new YourModuleService();
```

### Step 8: Create Store (Optional)
Edit `src/modules/your-module-name/store/yourModuleStore.ts`:

```typescript
import { create } from 'zustand';

interface YourModuleState {
  items: any[];
  setItems: (items: any[]) => void;
}

export const useYourModuleStore = create<YourModuleState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
}));
```

### Step 9: Create Components
Create React components in `src/modules/your-module-name/components/`

### Step 10: Create Routes
Create page components in `src/modules/your-module-name/routes/`

### Step 11: Export Module
Edit `src/modules/your-module-name/index.ts`:

```typescript
export * from './components';
export * from './routes';
export * from './services';
export * from './store';
export * from './types';
```

## Module Auto-Loading

The framework automatically:
- Discovers modules from `src/modules/` directory
- Loads routes from `module.config.json`
- Registers API endpoints
- Adds navigation items to sidebar
- Registers stores

## API Endpoints

Module APIs are automatically available at:
- `GET /api/{module-prefix}/` - List handler
- `POST /api/{module-prefix}/` - Create handler
- `GET /api/{module-prefix}/:id` - Get by ID handler
- `PATCH /api/{module-prefix}/:id` - Update handler
- `DELETE /api/{module-prefix}/:id` - Delete handler

## Routes

Module routes are automatically available at paths defined in `module.config.json`:
- `/your-module` - Main page
- `/your-module/new` - Create page
- `/your-module/:id` - Detail page

## Disabling a Module

To disable a module without deleting it:
1. Set `"enabled": false` in `module.config.json`
2. Or remove the module folder

## Module Dependencies

If your module depends on another module:
```json
{
  "dependencies": ["notes", "tasks"]
}
```

## Permissions

Define permissions in `module.config.json`:
```json
{
  "permissions": ["your-module.read", "your-module.write"]
}
```

## Best Practices

1. **Keep modules self-contained** - All module code should be in the module folder
2. **Use TypeScript** - Leverage type safety throughout
3. **Follow naming conventions** - See STRUCTURE.md
4. **Validate inputs** - Always use Zod schemas
5. **Handle errors** - Use consistent error handling
6. **Test modules** - Test each module independently

## Common Tasks

### Add a new API endpoint
1. Add endpoint definition to `api/endpoints.ts`
2. Create handler in `api/handlers/`
3. Update `module.config.json` if needed

### Add a new route
1. Create page component in `routes/`
2. Add route definition to `module.config.json`

### Add a new component
1. Create component in `components/`
2. Export from module `index.ts` if needed

### Access core functionality
- Database: `import { db } from '@/core/lib/db'`
- Auth: `import { useAuthStore } from '@/core/store/authStore'`
- Utils: `import { cn } from '@/core/lib/utils'`

