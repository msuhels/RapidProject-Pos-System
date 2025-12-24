# Environment Variables Setup

## Required Variables

### `DATABASE_URL` (REQUIRED)
**Purpose**: PostgreSQL database connection string

**Format**: 
```
postgresql://username:password@host:port/database_name
```

**Examples**:
```env
# Local development
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/rad_framework

# With specific port
DATABASE_URL=postgresql://postgres:mypassword@localhost:5433/rad_framework

# Remote database
DATABASE_URL=postgresql://user:pass@db.example.com:5432/rad_framework
```

**Where it's used**:
- `src/core/lib/db/index.ts` - Database connection
- `drizzle.config.ts` - Drizzle migrations

**Error if missing**: 
```
Error: DATABASE_URL environment variable is not set
```

---

## Optional Variables

### `NODE_ENV` (OPTIONAL but recommended)
**Purpose**: Application environment mode

**Values**: 
- `development` - Development mode (default)
- `production` - Production mode
- `test` - Testing mode

**Default**: `development` (if not set)

**Where it's used**:
- `src/app/api/auth/login/route.ts` - Sets secure cookie flag in production

**Example**:
```env
NODE_ENV=development
```

**Note**: In production, this ensures cookies are set with `secure: true` flag for HTTPS.

---

## Setup Instructions

### 1. Create `.env.local` file

In the project root, create a file named `.env.local`:

```bash
# Copy the example file
cp .env.example .env.local
```

Or create it manually with:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/rad_framework
NODE_ENV=development
```

### 2. Update with your database credentials

Replace the placeholder values with your actual PostgreSQL credentials:

```env
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT/YOUR_DATABASE
```

### 3. Verify the connection

Test your database connection:

```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Seed demo data
npm run seed
```

---

## Environment File Priority

Next.js loads environment variables in this order (later files override earlier ones):

1. `.env` - Default for all environments
2. `.env.local` - Local overrides (gitignored)
3. `.env.development` - Development environment
4. `.env.development.local` - Local development overrides
5. `.env.production` - Production environment
6. `.env.production.local` - Local production overrides

**Recommendation**: Use `.env.local` for local development (it's gitignored by default).

---

## Security Notes

⚠️ **Never commit `.env.local` to git!**

- `.env.local` is automatically gitignored
- `.env.example` is safe to commit (contains no secrets)
- Use different credentials for development and production
- Rotate database passwords regularly

---

## Troubleshooting

### Database Connection Error

**Error**: `DATABASE_URL environment variable is not set`

**Solution**:
1. Check `.env.local` exists in project root
2. Verify `DATABASE_URL` is set correctly
3. Restart the dev server after adding env variables

### Connection Refused

**Error**: Connection to database fails

**Solution**:
1. Verify PostgreSQL is running: `pg_isready` or check service status
2. Check database credentials are correct
3. Verify database exists: `psql -U username -d database_name`
4. Check firewall/network settings if using remote database

### Wrong Database

**Error**: Migrations run on wrong database

**Solution**:
1. Double-check `DATABASE_URL` points to correct database
2. Use different `.env.local` for different projects
3. Verify database name in connection string

---

## Quick Reference

```env
# Minimum required for login functionality
DATABASE_URL=postgresql://user:password@localhost:5432/rad_framework

# Recommended
NODE_ENV=development
```

