# Database Setup Guide

## Quick Start

Follow these steps in order:

### 1. Initialize Database (Creates database if it doesn't exist)
```bash
npm run db:init
```

This will:
- Parse your `DATABASE_URL` from `.env.local`
- Connect to PostgreSQL
- Check if the database exists
- Create it if it doesn't exist

### 2. Generate Migrations
```bash
npm run db:generate
```

This creates migration files from your schema.

### 3. Run Migrations (Create tables)
```bash
npm run db:migrate
```

This applies migrations to create tables in your database.

### 4. Seed Demo Data
```bash
npm run seed
```

This adds demo users for testing.

## Complete Setup Flow

```bash
# Step 1: Create database if needed
npm run db:init

# Step 2: Generate migrations from schema
npm run db:generate

# Step 3: Apply migrations (create tables)
npm run db:migrate

# Step 4: Add demo data
npm run seed
```

## Troubleshooting

### Error: "database does not exist"
**Solution**: Run `npm run db:init` first to create the database.

### Error: "password authentication failed"
**Solution**: Check your `DATABASE_URL` in `.env.local` has correct credentials.

### Error: "ECONNREFUSED"
**Solution**: Make sure PostgreSQL is running on your system.

### Error: "permission denied"
**Solution**: Your database user may not have permission to create databases. 
- Option 1: Create database manually:
  ```sql
  CREATE DATABASE your_database_name;
  ```
- Option 2: Use a superuser account in `DATABASE_URL`

## Environment Setup

Make sure `.env.local` has:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

## Database Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run db:init` | Create database if it doesn't exist |
| `npm run db:generate` | Generate migration files from schema |
| `npm run db:migrate` | Apply migrations to database |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |
| `npm run seed` | Add demo data to database |

## Manual Database Creation

If the script doesn't work, you can create the database manually:

1. Connect to PostgreSQL:
   ```bash
   psql -U postgres
   ```

2. Create database:
   ```sql
   CREATE DATABASE your_database_name;
   ```

3. Exit:
   ```sql
   \q
   ```

4. Then continue with migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

