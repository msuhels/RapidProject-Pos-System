# Rapid Application Development Framework

A modular, highly customizable framework for rapid MVP development built with Next.js, Zustand, PostgreSQL, Tailwind, ShadCN, Zod, and Drizzle ORM.

## Features

- **Modular Architecture**: Self-contained modules that can be plugged in or removed without conflicts
- **Auto-Discovery**: Automatic route and API loading from module configurations
- **Type-Safe**: Full TypeScript support with Zod validation
- **Rapid Development**: Pre-configured structure for fast feature development

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **State Management**: Zustand
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN
- **Validation**: Zod
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/        # Protected dashboard routes
│   └── api/               # API routes
├── core/                  # Core system
│   ├── components/        # Shared components
│   ├── hooks/             # Shared hooks
│   ├── lib/               # Utilities and core logic
│   ├── middleware/        # Middleware functions
│   ├── store/             # Core stores
│   ├── types/             # Shared types
│   └── config/            # Configuration
└── modules/               # Feature modules
    ├── notes/             # Notes module example
    └── _template/         # Template for new modules
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Update `.env.local` with your database connection string.

4. Run database migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Module Development

### Creating a New Module

1. Copy the `_template` folder in `src/modules/` to create your new module
2. Update `module.config.json` with your module configuration
3. Define API endpoints in `api/endpoints.ts`
4. Create handlers in `api/handlers/`
5. Add routes in `routes/`
6. Implement services, components, and stores as needed

### Module Structure

Each module follows this structure:

```
module-name/
├── module.config.json     # Module manifest
├── api/
│   ├── endpoints.ts       # API definitions
│   └── handlers/         # API handlers
├── components/           # Module components
├── routes/               # Page components
├── services/             # Business logic
├── store/                # Zustand store
├── schemas/              # Database & validation schemas
├── types/                # Module types
└── index.ts              # Module exports
```

## Core Features

### Authentication

- Login functionality
- Registration
- Protected routes
- Session management

### Dashboard

- Sidebar navigation
- Top bar
- Content area
- Auto-loaded module navigation

### Notes Module (Example)

- Create notes
- List notes
- View note details
- Update notes
- Delete notes

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

## License

MIT
