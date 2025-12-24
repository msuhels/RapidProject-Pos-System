# Project Structure Overview

This document provides a detailed overview of the Rapid Application Development Framework structure.

## Directory Structure

```
project-root/
├── src/
│   ├── app/                                    # Next.js App Router
│   │   ├── (auth)/                             # Authentication route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx                    # Login page
│   │   │   ├── register/
│   │   │   │   └── page.tsx                    # Registration page
│   │   │   └── layout.tsx                      # Auth layout
│   │   ├── (dashboard)/                        # Protected dashboard routes
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx                    # Dashboard home page
│   │   │   ├── profile/
│   │   │   │   └── page.tsx                    # User profile page
│   │   │   ├── [...slug]/                      # Universal dynamic module routes
│   │   │   │   └── page.tsx                    # Auto-loads module pages
│   │   │   └── layout.tsx                      # Dashboard layout (Sidebar + Topbar)
│   │   ├── api/
│   │   │   ├── auth/                           # Core auth endpoints
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── register/
│   │   │   │   │   └── route.ts
│   │   │   │   └── profile/
│   │   │   │       └── route.ts
│   │   │   └── [...path]/                      # Universal dynamic API routes
│   │   │       └── route.ts                     # Auto-loads module APIs
│   │   ├── providers.tsx                       # App-level providers
│   │   ├── layout.tsx                          # Root layout
│   │   ├── page.tsx                            # Root page
│   │   └── globals.css                         # Global styles
│   │
│   ├── core/                                   # Core system
│   │   ├── components/
│   │   │   ├── ui/                             # ShadCN UI components
│   │   │   ├── layout/                         # Layout components
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Topbar.tsx
│   │   │   │   ├── DashboardLayout.tsx
│   │   │   │   └── Footer.tsx
│   │   │   └── common/                         # Common components
│   │   │       ├── DataTable.tsx
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       ├── PageHeader.tsx
│   │   │       └── EmptyState.tsx
│   │   ├── hooks/                              # Shared hooks
│   │   │   ├── useStore.ts
│   │   │   ├── useAuth.ts
│   │   │   ├── useApi.ts
│   │   │   ├── useToast.ts
│   │   │   ├── usePermissions.ts
│   │   │   └── useModuleRoutes.ts
│   │   ├── lib/
│   │   │   ├── db/
│   │   │   │   ├── index.ts                    # Drizzle client
│   │   │   │   ├── baseSchema.ts               # Core schemas (users, etc.)
│   │   │   │   └── migrations/                 # Database migrations
│   │   │   ├── api/
│   │   │   │   ├── client.ts                   # API client utilities
│   │   │   │   ├── errorHandler.ts
│   │   │   │   └── apiRouter.ts                # Auto API routing
│   │   │   ├── moduleLoader.ts                 # Module auto-discovery
│   │   │   ├── routeGenerator.ts               # Route generation
│   │   │   ├── permissions.ts                  # Permission utilities
│   │   │   └── utils.ts                        # Utility functions
│   │   ├── middleware/                         # Middleware functions
│   │   │   ├── index.ts                        # Middleware registry
│   │   │   ├── auth.ts
│   │   │   ├── permissions.ts
│   │   │   ├── validation.ts
│   │   │   ├── rateLimit.ts
│   │   │   └── logger.ts
│   │   ├── store/                              # Core stores
│   │   │   ├── storeRegistry.ts                # Auto store loader
│   │   │   ├── createStore.ts                  # Store factory
│   │   │   ├── globalStore.ts                  # Root store
│   │   │   └── authStore.ts                    # Core auth store
│   │   ├── extensions/                         # Core feature extensions
│   │   │   ├── auth/
│   │   │   │   ├── registration.ts
│   │   │   │   ├── profile.ts
│   │   │   │   ├── passwordReset.ts
│   │   │   │   └── emailVerification.ts
│   │   │   └── index.ts
│   │   ├── types/                              # Shared types
│   │   │   ├── index.ts
│   │   │   ├── module.ts                       # Module contracts
│   │   │   └── api.ts                          # API types
│   │   └── config/
│   │       ├── moduleRegistry.ts               # Module registration
│   │       └── app.config.ts                   # App configuration
│   │
│   ├── modules/                                # Feature modules (plug-and-play)
│   │   ├── notes/                              # Notes module example
│   │   │   ├── module.config.json              # Module manifest
│   │   │   ├── api/
│   │   │   │   ├── endpoints.ts                # API endpoint definitions
│   │   │   │   └── handlers/
│   │   │   │       ├── list.ts                 # GET /api/notes
│   │   │   │       ├── create.ts               # POST /api/notes
│   │   │   │       ├── getById.ts              # GET /api/notes/:id
│   │   │   │       ├── update.ts               # PATCH /api/notes/:id
│   │   │   │       └── delete.ts               # DELETE /api/notes/:id
│   │   │   ├── components/
│   │   │   │   ├── NoteForm.tsx
│   │   │   │   ├── NoteList.tsx
│   │   │   │   ├── NoteCard.tsx
│   │   │   │   └── NoteFilters.tsx
│   │   │   ├── routes/                         # Module pages
│   │   │   │   ├── index.tsx                   # /notes
│   │   │   │   ├── new.tsx                     # /notes/new
│   │   │   │   └── [id].tsx                    # /notes/:id
│   │   │   ├── services/
│   │   │   │   └── notesService.ts              # Business logic
│   │   │   ├── store/
│   │   │   │   ├── store.config.json           # Store configuration
│   │   │   │   └── notesStore.ts               # Zustand store
│   │   │   ├── schemas/
│   │   │   │   ├── notesSchema.ts              # Drizzle database schema
│   │   │   │   └── notesValidation.ts          # Zod validation schemas
│   │   │   ├── types/
│   │   │   │   └── index.ts                     # Module types
│   │   │   └── index.ts                         # Module exports
│   │   │
│   │   └── _template/                          # Template for new modules
│   │       ├── module.config.json
│   │       ├── api/
│   │       ├── components/
│   │       ├── routes/
│   │       ├── services/
│   │       ├── store/
│   │       ├── schemas/
│   │       ├── types/
│   │       └── index.ts
│   │
│   └── middleware.ts                            # Next.js middleware
│
├── public/                                      # Static assets
│   ├── images/
│   └── icons/
│
├── drizzle/                                     # Database migrations
│   └── migrations/
│
├── .env.local                                   # Environment variables
├── .env.example                                 # Environment template
├── drizzle.config.ts                            # Drizzle ORM config
├── next.config.ts                               # Next.js config
├── tailwind.config.js                           # Tailwind config
├── tsconfig.json                                 # TypeScript config
├── package.json                                 # Dependencies
├── README.md                                    # Project documentation
└── STRUCTURE.md                                  # This file
```

## Key Features

### 1. Modular Architecture
- Each module is self-contained with its own API, components, routes, services, store, and schemas
- Modules can be added or removed without affecting other modules
- Auto-discovery system loads modules automatically

### 2. Auto-Loading System
- **Routes**: Module routes are automatically discovered and registered
- **APIs**: Module API endpoints are automatically loaded and routed
- **Navigation**: Sidebar navigation is automatically generated from module configs

### 3. Core System
- Shared components, hooks, and utilities
- Centralized authentication and authorization
- Database connection and schema management
- Middleware system for cross-cutting concerns

### 4. Module Configuration
Each module has a `module.config.json` that defines:
- Module metadata (id, name, version, description)
- Navigation items
- Routes
- API endpoints
- Permissions
- Dependencies

## Module Development Workflow

1. **Create Module**: Copy `_template` folder
2. **Configure**: Update `module.config.json`
3. **Define APIs**: Create endpoints and handlers
4. **Build UI**: Create components and routes
5. **Implement Logic**: Add services and stores
6. **Test**: Module is automatically integrated

## File Naming Conventions

- **Components**: PascalCase (e.g., `NoteForm.tsx`)
- **Services**: camelCase with "Service" suffix (e.g., `notesService.ts`)
- **Stores**: camelCase with "Store" suffix (e.g., `notesStore.ts`)
- **Schemas**: camelCase with "Schema" suffix (e.g., `notesSchema.ts`)
- **Types**: camelCase (e.g., `index.ts` in types folder)
- **Handlers**: camelCase (e.g., `list.ts`, `create.ts`)

## Configuration Files

- `module.config.json`: Module manifest
- `store.config.json`: Store configuration
- `drizzle.config.ts`: Database configuration
- `.env.local`: Environment variables

