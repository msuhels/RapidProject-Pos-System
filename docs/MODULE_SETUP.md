# Module Setup Guide

This framework supports automatic module discovery and registration. Simply add a module to the `src/modules/` folder with a `module.config.json` file, and it will be automatically:

- ✅ Discovered and registered
- ✅ Added to the sidebar navigation
- ✅ Routes made accessible
- ✅ API endpoints registered

## Quick Start

### 1. Create Module Folder Structure

```
src/modules/
  your-module/
    ├── module.config.json    # Required: Module configuration
    ├── routes/               # Optional: Page components
    │   ├── index.tsx
    │   └── new.tsx
    ├── api/                  # Optional: API handlers
    │   └── handlers/
    │       ├── list.ts
    │       └── create.ts
    ├── components/           # Optional: React components
    ├── services/             # Optional: Business logic
    ├── store/                # Optional: Zustand store
    ├── schemas/              # Optional: Zod schemas
    └── types/                # Optional: TypeScript types
```

### 2. Create `module.config.json`

```json
{
  "id": "your-module",
  "name": "Your Module Name",
  "version": "1.0.0",
  "description": "Description of your module",
  "routes": [
    {
      "path": "/your-module",
      "component": "index",
      "title": "Your Module Page"
    },
    {
      "path": "/your-module/new",
      "component": "new",
      "title": "Create New Item"
    }
  ],
  "api": {
    "basePath": "/api/your-module",
    "endpoints": [
      {
        "method": "GET",
        "path": "",
        "handler": "list",
        "requiresAuth": true
      },
      {
        "method": "POST",
        "path": "",
        "handler": "create",
        "requiresAuth": true
      },
      {
        "method": "GET",
        "path": "/:id",
        "handler": "getById",
        "requiresAuth": true
      }
    ]
  },
  "navigation": {
    "label": "Your Module",
    "icon": "FileText",
    "path": "/your-module",
    "order": 1
  },
  "permissions": {
    "create": "your-module:create",
    "read": "your-module:read",
    "update": "your-module:update",
    "delete": "your-module:delete"
  }
}
```

### 3. Create Route Components

Create page components in `routes/` folder. Each route component must be a **default export**:

```tsx
// src/modules/your-module/routes/index.tsx
'use client';

export default function YourModulePage() {
  return (
    <div>
      <h1>Your Module</h1>
    </div>
  );
}
```

### 4. Create API Handlers

Create API handlers in `api/handlers/` folder. Export named functions matching HTTP methods:

```ts
// src/modules/your-module/api/handlers/list.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const userId = authResult;
    
    // Your logic here
    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Configuration Options

### Routes

- `path`: URL path (e.g., `/notes`, `/notes/:id`)
- `component`: Component file name in `routes/` folder (without extension)
- `title`: Page title
- `requiresAuth`: Whether route requires authentication (optional)
- `permissions`: Required permissions (optional)

### API Endpoints

- `method`: HTTP method (GET, POST, PATCH, PUT, DELETE)
- `path`: Endpoint path relative to `basePath` (use `:id` for params)
- `handler`: Handler file name in `api/handlers/` folder (without extension)
- `requiresAuth`: Whether endpoint requires authentication (optional)
- `permissions`: Required permissions (optional)
- `middleware`: Array of middleware names (optional)

### Navigation

- `label`: Display name in sidebar
- `icon`: Lucide React icon name (e.g., "FileText", "Settings", "Users")
- `path`: Navigation link path
- `order`: Display order (lower numbers appear first)
- `children`: Nested navigation items (optional)

## Icons

Use any icon from [Lucide React](https://lucide.dev/icons/). Just use the icon name in PascalCase:

- `FileText` → FileText icon
- `Settings` → Settings icon
- `Users` → Users icon
- etc.

## Example: Notes Module

See `src/modules/notes/` for a complete working example.

## Notes

- Module folders starting with `_` (like `_template`) are ignored
- Routes are automatically accessible at the configured paths
- API endpoints are automatically registered at `/api/[basePath]/[endpoint path]`
- Navigation items appear in the sidebar automatically
- No manual registration needed - just add the module folder!

