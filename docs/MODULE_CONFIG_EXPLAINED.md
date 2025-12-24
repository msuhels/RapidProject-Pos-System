# Understanding `module.config.json` - The Module Manifest

## 🎯 Primary Purpose

`module.config.json` is the **manifest file** that tells the framework everything it needs to know about your module. It's the **single source of truth** for module configuration and enables **zero-configuration module registration**.

Think of it as a "package.json" for your module - it describes what your module does, what routes it exposes, what APIs it provides, and how it should appear in the UI.

---

## 🔑 Key Role: Auto-Discovery & Registration

The framework uses this file to **automatically**:

1. **Discover** your module (scans `src/modules/` folder)
2. **Load** the configuration (reads `module.config.json`)
3. **Register** routes, API endpoints, and navigation
4. **Wire everything together** without manual code changes

**Without this file, your module won't be recognized by the framework!**

---

## 📋 Configuration Sections Explained

### 1. **Basic Module Info**

```json
{
  "id": "notes",           // Unique module identifier (must match folder name)
  "name": "Notes",         // Display name
  "version": "1.0.0",      // Module version
  "description": "...",    // Module description
  "enabled": true          // If false, module is hidden from UI and routes/APIs are disabled
}
```

**Purpose:** Identifies and describes your module.

**`enabled` field:**
- `true` (default): Module is active and appears in UI
- `false`: Module is completely hidden - no sidebar item, no routes, no API endpoints
- If omitted, defaults to `true`

**Used by:** Module registry for tracking and logging. All UI/routing systems check this flag.

---

### 2. **Routes Configuration**

```json
"routes": [
  {
    "path": "/notes",           // URL path where page is accessible
    "component": "index",        // Component file name (without .tsx)
    "title": "My Notes"         // Page title
  },
  {
    "path": "/notes/new",
    "component": "new",
    "title": "Create Note"
  }
]
```

**Purpose:** Defines which pages your module exposes and where they're accessible.

**How it works:**
- When user visits `/notes`, the framework:
  1. Matches the path in `module.config.json`
  2. Finds `component: "index"` 
  3. Dynamically imports `src/modules/notes/routes/index.tsx`
  4. Renders that component

**File mapping:**
- `component: "index"` → `routes/index.tsx`
- `component: "new"` → `routes/new.tsx`
- `component: "edit"` → `routes/edit.tsx`

**Used by:** `src/app/(dashboard)/[...slug]/page.tsx` (dynamic route handler)

---

### 3. **API Endpoints Configuration**

```json
"api": {
  "basePath": "/api/notes",     // Base URL for all endpoints
  "endpoints": [
    {
      "method": "GET",           // HTTP method
      "path": "",                // Path relative to basePath (empty = root)
      "handler": "list",         // Handler file name (without .ts)
      "requiresAuth": true       // Whether auth is required
    },
    {
      "method": "POST",
      "path": "",
      "handler": "create",
      "requiresAuth": true
    },
    {
      "method": "GET",
      "path": "/:id",            // Route parameter
      "handler": "getById",
      "requiresAuth": true
    }
  ]
}
```

**Purpose:** Defines all API endpoints your module provides.

**How it works:**
- When request comes to `/api/notes`:
  1. Framework matches `basePath: "/api/notes"` + `path: ""`
  2. Finds `handler: "list"` with `method: "GET"`
  3. Dynamically imports `src/modules/notes/api/handlers/list.ts`
  4. Calls the exported `GET` function

**File mapping:**
- `handler: "list"` → `api/handlers/list.ts` (exports `GET` function)
- `handler: "create"` → `api/handlers/create.ts` (exports `POST` function)
- `handler: "getById"` → `api/handlers/getById.ts` (exports `GET` function)

**Route parameters:**
- `path: "/:id"` means the endpoint accepts a dynamic ID
- Example: `/api/notes/123` matches `/:id` with `id = "123"`

**Used by:** `src/core/lib/api/apiRouter.ts` (dynamic API router)

---

### 4. **Navigation Configuration**

```json
"navigation": {
  "label": "Notes",              // Text shown in sidebar
  "icon": "FileText",            // Lucide React icon name
  "path": "/notes",              // Link destination
  "order": 2                     // Display order (lower = first)
}
```

**Purpose:** Controls how your module appears in the sidebar navigation.

**How it works:**
- Framework reads all modules' `navigation` configs
- Sorts by `order` (ascending)
- Renders sidebar menu items automatically
- Icons are loaded from Lucide React library

**Icon names:** Use PascalCase names from [Lucide Icons](https://lucide.dev/icons/)
- `FileText`, `Activity`, `Settings`, `Users`, `Calendar`, etc.

**Used by:** `src/core/components/layout/Sidebar.tsx` (sidebar component)

---

### 5. **Permissions Configuration**

```json
"permissions": {
  "create": "notes:create",
  "read": "notes:read",
  "update": "notes:update",
  "delete": "notes:delete"
}
```

**Purpose:** Defines permission strings for your module's operations.

**How it works:**
- These are **declarative** - they define what permissions exist
- Actual permission checking is implemented in middleware/handlers
- Follows pattern: `[module]:[action]`

**Used by:** Permission middleware (when implemented)

---

## 🔄 How the Framework Uses This File

### Step 1: Module Discovery

```typescript
// src/core/lib/moduleLoader.ts
export function discoverModules(): string[] {
  // Scans src/modules/ folder
  // Finds folders that don't start with "_"
  // Returns: ["notes", "activity", ...]
}
```

### Step 2: Config Loading

```typescript
export function loadModuleConfig(moduleId: string): ModuleConfig | null {
  // Reads: src/modules/[moduleId]/module.config.json
  // Parses JSON
  // Validates required fields (id, name, version)
  // Returns config object
}
```

### Step 3: Registration

```typescript
// src/core/config/moduleRegistry.ts
class ModuleRegistry {
  initialize() {
    const modules = loadAllModules();
    // For each module:
    // - Store config in registry
    // - Extract routes → register for routing
    // - Extract API endpoints → register for API routing
    // - Extract navigation → register for sidebar
  }
}
```

### Step 4: Dynamic Routing

**Frontend Routes:**
```typescript
// src/app/(dashboard)/[...slug]/page.tsx
// When user visits /notes:
// 1. Get all routes from registry
// 2. Match path "/notes" to config
// 3. Find component: "index"
// 4. Import: @/modules/notes/routes/index
// 5. Render component
```

**API Routes:**
```typescript
// src/core/lib/api/apiRouter.ts
// When request comes to /api/notes:
// 1. Get all endpoints from registry
// 2. Match basePath + path: "/api/notes" + ""
// 3. Find handler: "list" with method: "GET"
// 4. Import: @/modules/notes/api/handlers/list
// 5. Call GET function
```

**Sidebar:**
```typescript
// src/core/components/layout/Sidebar.tsx
// On component mount:
// 1. Fetch navigation items from /api/modules/navigation
// 2. Server reads all modules' navigation configs
// 3. Returns sorted list
// 4. Renders sidebar menu items
```

---

## ✅ What Happens When You Add This File

Once you create `module.config.json` in your module folder:

1. ✅ **Module is discovered** - Framework finds it on startup
2. ✅ **Routes are registered** - Pages become accessible at defined paths (if `enabled: true`)
3. ✅ **API endpoints are registered** - Handlers become accessible (if `enabled: true`)
4. ✅ **Navigation appears** - Sidebar menu item is added automatically (if `enabled: true`)
5. ✅ **No manual wiring needed** - Everything works automatically!

**If `enabled: false`:**
- ❌ Module is still discovered but hidden
- ❌ Routes return 404
- ❌ API endpoints return 404
- ❌ No sidebar menu item
- ✅ Module code remains in codebase (can be re-enabled easily)

---

## 🚫 What Happens Without This File

If `module.config.json` is missing:

- ❌ Module is **not discovered** (skipped during scan)
- ❌ Routes **don't work** (404 errors)
- ❌ API endpoints **don't work** (404 errors)
- ❌ Navigation **doesn't appear** (no sidebar item)
- ⚠️ Console warning: `Module [name] has no module.config.json`

---

## 📝 Best Practices

### 1. **Keep it Simple**
- Only define what you need
- Don't add routes/endpoints you haven't created yet

### 2. **Naming Consistency**
- `id` should match folder name
- `component` names should match file names (without extension)
- `handler` names should match file names (without extension)

### 3. **Path Consistency**
- Route `path` should match navigation `path` (usually)
- API `basePath` should follow pattern: `/api/[module-id]`

### 4. **Order Matters**
- Use `order` in navigation to control sidebar position
- Lower numbers appear first

### 5. **Version Tracking**
- Update `version` when you make breaking changes
- Helps with module management and updates

---

## 🔍 Real-World Example: Notes Module

Looking at the notes module config:

```json
{
  "id": "notes",                    // Folder: src/modules/notes/
  "routes": [
    {
      "path": "/notes",              // User visits: /notes
      "component": "index",          // Loads: routes/index.tsx
      "title": "My Notes"
    }
  ],
  "api": {
    "basePath": "/api/notes",        // All APIs under /api/notes
    "endpoints": [
      {
        "method": "GET",
        "path": "",                  // Full path: /api/notes
        "handler": "list",           // Loads: api/handlers/list.ts
        "requiresAuth": true
      }
    ]
  },
  "navigation": {
    "label": "Notes",                // Shows "Notes" in sidebar
    "icon": "FileText",              // Uses FileText icon
    "path": "/notes",                // Links to /notes
    "order": 2                       // Appears 2nd in sidebar
  }
}
```

**Result:**
- ✅ Sidebar shows "Notes" menu item
- ✅ Clicking it navigates to `/notes`
- ✅ Page loads `routes/index.tsx` component
- ✅ Component can call `/api/notes` API
- ✅ API routes to `api/handlers/list.ts` handler
- ✅ All without any manual registration!

---

## 🎓 Summary

`module.config.json` is:

1. **The Module Manifest** - Describes what your module does
2. **Auto-Discovery Driver** - Enables zero-config registration
3. **Routing Configuration** - Defines routes and API endpoints
4. **UI Integration** - Controls sidebar appearance
5. **Single Source of Truth** - One file controls everything

**Key Takeaway:** This file is what makes the framework "plug-and-play". Just add the file, and your module is automatically integrated into the entire system!

