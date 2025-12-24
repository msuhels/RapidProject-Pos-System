# Login Implementation Guide

## Overview

Custom login functionality has been implemented following the project framework rules. All code is custom-built without third-party authentication services.

## What Was Implemented

### 1. Database Setup
- **User Schema** (`src/core/lib/db/baseSchema.ts`): PostgreSQL schema with Drizzle ORM
- **Database Connection** (`src/core/lib/db/index.ts`): Drizzle client configured with Postgres

### 2. Authentication Store
- **Auth Store** (`src/core/store/authStore.ts`): Zustand store with persistence for user state

### 3. Validation & Middleware
- **Login Validation** (`src/core/lib/validations/auth.ts`): Zod schema for email/password validation
- **Auth Middleware** (`src/core/middleware/auth.ts`): Token verification utilities
- **Validation Middleware** (`src/core/middleware/validation.ts`): Request validation helpers

### 4. Custom UI Components
- **Input Component** (`src/core/components/ui/input.tsx`): Custom input with label and error handling
- **Button Component** (`src/core/components/ui/button.tsx`): Custom button with variants

### 5. Login Page
- **Login Page** (`src/app/(auth)/login/page.tsx`): Custom login form with validation
- **Login API** (`src/app/api/auth/login/route.ts`): API endpoint with password verification

### 6. Route Protection
- **Middleware** (`src/middleware.ts`): Protects dashboard routes, redirects to login
- **Root Page** (`src/app/page.tsx`): Redirects based on auth state

### 7. Seed Script
- **Seed CLI** (`scripts/seed.ts`): Adds demo users to database

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

**Note:** The seed script requires `tsx` to run TypeScript files. Install it if not already present:
```bash
npm install -D tsx
```

### 2. Configure Database
1. Create `.env.local` file:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/rad_framework
NODE_ENV=development
```

2. Run database migrations:
```bash
npm run db:generate
npm run db:migrate
```

### 3. Seed Demo Data
```bash
npm run seed
```

This creates two demo users:
- **Admin**: `admin@example.com` / `admin123`
- **User**: `user@example.com` / `user123`

### 4. Start Development Server
```bash
npm run dev
```

## How It Works

### Authentication Flow

1. **User visits login page** (`/login`)
2. **Submits credentials** → Validated with Zod schema
3. **API call** → `/api/auth/login` verifies password against database
4. **On success**:
   - User data stored in Zustand store (persisted)
   - Token set in HTTP-only cookie
   - Redirect to `/dashboard`
5. **Middleware** checks cookie on protected routes

### Password Hashing

Currently uses a simple hash function for demo purposes. **For production, replace with bcrypt or similar secure hashing library.**

The hash function is in `src/core/lib/utils.ts`:
- `hashPassword(password)` - Hashes password
- `verifyPassword(password, hash)` - Verifies password against hash

### Token System

- **Demo**: User ID as token (stored in cookie)
- **Production**: Should use JWT or session tokens
- Token is HTTP-only cookie for security

## File Structure

```
src/
├── core/
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts              # Drizzle connection
│   │   │   └── baseSchema.ts         # User schema
│   │   ├── validations/
│   │   │   └── auth.ts               # Login validation schema
│   │   └── utils.ts                  # Password hashing utilities
│   ├── middleware/
│   │   ├── auth.ts                   # Auth verification
│   │   └── validation.ts             # Request validation
│   ├── store/
│   │   └── authStore.ts              # Zustand auth store
│   └── components/
│       └── ui/
│           ├── input.tsx              # Custom input
│           └── button.tsx            # Custom button
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx              # Login page
│   ├── api/
│   │   └── auth/
│   │       └── login/
│   │           └── route.ts          # Login API
│   └── page.tsx                      # Root redirect
└── middleware.ts                     # Route protection

scripts/
└── seed.ts                           # Database seed script
```

## Security Notes

⚠️ **Current Implementation is for Development/Demo Only**

1. **Password Hashing**: Simple hash function - replace with bcrypt for production
2. **Token System**: User ID as token - replace with JWT for production
3. **Session Management**: Basic cookie - implement proper session management
4. **Rate Limiting**: Not implemented - add rate limiting to login endpoint
5. **CSRF Protection**: Not implemented - add CSRF tokens for production

## Next Steps

1. Replace password hashing with bcrypt
2. Implement JWT tokens
3. Add rate limiting to login endpoint
4. Add CSRF protection
5. Implement logout functionality
6. Add password reset feature
7. Add email verification

## Testing

1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Should redirect to `/login`
4. Use demo credentials:
   - Email: `admin@example.com`
   - Password: `admin123`
5. Should redirect to `/dashboard` on success

## Troubleshooting

### Database Connection Error
- Check `.env.local` has correct `DATABASE_URL`
- Ensure PostgreSQL is running
- Verify database exists

### Seed Script Fails
- Install tsx: `npm install -D tsx`
- Run migrations first: `npm run db:migrate`
- Check database connection

### Login Not Working
- Check browser console for errors
- Verify database has seeded users
- Check API response in Network tab
- Verify password hashing matches

