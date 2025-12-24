## Core System Overview (`src/core`)

This document explains **what the core layer is**, **where things live**, and **how they work together** to support dynamic modules.

---

## What the Core Layer Does

- **Application backbone**: Shared system used by all modules (auth, permissions, routing, stores, UI shell).
- **Never module-specific**: No business logic for a single module (Projects, Tasks, etc.) should live here.
- **Stable contracts**: Provides hooks, services, types, and patterns that modules must follow.

---

## Core Directory Structure

### `src/core/components`

- **`components/ui`**  
  - **What**: ShadCN-based UI primitives (Button, Input, Dialog, Table, etc.).  
  - **Used by**: All modules and core pages for consistent design.

- **`components/layout`**  
  - **What**: Layout shell (Sidebar, Topbar, DashboardLayout, Footer).  
  - **How it works**:
    - Reads the **module registry** to build navigation.
    - Wraps all dashboard routes with a consistent layout.

- **`components/common`**  
  - **What**: Shared functional components (DataTable, EmptyState, PermissionGate, ProtectedPage, etc.).  
  - **Why**: Reuse common patterns (tables, loading, permission-based UI) instead of re‑implementing in each module.

- **`components/roles`**  
  - **What**: Role and permission management UI (role list, expandable role table, permission assignment).  
  - **How it connects**:
    - Talks to role/permission APIs.
    - Reads module + field metadata from core DB schemas.

### `src/core/hooks`

- **`useStore` / store hooks**  
  - **What**: Core entry point to access module or global stores.  
  - **Usage**: Modules should use these instead of creating custom store wiring.

- **`useAuth`**  
  - **What**: Provides current user, role, and auth state.  
  - **Used for**: Guarding pages, conditional UI, passing user data to services.

- **`useApi` / `useToast` / `useModuleRoutes` / `usePermissions`**  
  - **What**: Standardized HTTP calls, toasts, dynamic route helpers, and permission checks.  
  - **Rule**: When a hook exists here, **use it**, do not create a custom replacement in modules.

### `src/core/lib`

- **`lib/db`**  
  - **What**: Drizzle client, base schemas (users, roles, permissions, etc.), and migrations.  
  - **Modules**: Reference core tables (users, roles, permissions) when needed but keep their own schemas in `src/modules/[module]/schemas`.

- **`lib/moduleLoader.ts`**  
  - **What**: Auto-discovers modules from `src/modules`, reads `module.config.json`, and registers them.  
  - **Effect**:
    - Dashboard routes for each module are auto-wired.
    - API endpoints for each module are auto-registered.
    - Navigation is generated from module configs.

- **`lib/routeGenerator.ts`**  
  - **What**: Builds actual Next.js routes from module config + loader data.

- **`lib/permissions.ts`**  
  - **What**: Core permission utilities used by both API and UI.  
  - **Used for**:
    - Checking if a user has `module:action` permissions.
    - Integrating with `PermissionGate`, `ProtectedPage`, and backend guards.

- **`lib/services`**  
  - **What**: Core business services that are **not tied to a single module** (e.g., `rolesService`, `rolePermissionsService`).  
  - **Rule**: Module-specific behaviour stays in `src/modules/[module]/services`, not here.

- **`lib/validations`**  
  - **What**: Zod schemas for core flows (roles, auth, etc.).

### `src/core/middleware`

- **What**: Reusable middlewares (auth, permissions, validation, rateLimit, logger).  
- **How modules use it**:
  - Module API handlers reference middleware keys in their config (e.g. `"middleware": ["auth", "permission:notes.read"]`).
  - The central API router chains these middlewares automatically for each endpoint.

### `src/core/store`

- **What**: Global and factory stores (store registry, global store, auth store, store factory).  
- **How it works**:
  - Provides a **standard pattern** for module stores (`createModuleStore`).
  - Ensures all modules register stores in a consistent way via `store.config.json`.

### `src/core/config`

- **What**: Global app configuration and module registry.  
- **Key file**: `moduleRegistry.ts` – central source of truth for which modules are enabled and how they appear in navigation.

### `src/core/types`

- **What**: Shared TypeScript contracts (module contracts, API types, core types).  
- **Why**: Modules use these to stay type-safe when integrating with core services and loaders.

### `src/core/extensions`

- **What**: Pluggable core features (auth flows like registration, profile, password reset, email verification).  
- **Usage**: Extended behaviour for core features without touching module code.

---

## How Core and Modules Work Together (High Level)

- **Core discovers modules** using `moduleLoader` + `moduleRegistry` and `module.config.json`.
- **Core exposes contracts** (`types/module.ts`, hooks, services, middleware) that every module must follow.
- **Modules provide**:
  - Their own schemas, API handlers, stores, components, and routes.
  - A `module.config.json` that declares routes, API endpoints, navigation, and permissions.
- **Core handles**:
  - Auth, role and permission evaluation.
  - Routing and API dispatching to the right module.
  - Shared UI and UX patterns (layout, data tables, permission-based UI).

Whenever you build a new dynamic module, **treat `src/core` as read‑only infrastructure** and plug into it using the patterns and contracts defined here and in `cursor.md`.


