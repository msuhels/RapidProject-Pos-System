# Module Seeding Guide

## Overview

The framework includes an automatic seeding system that discovers and runs seed files from all modules. Each module can have its own seed file to populate demo/test data.

## How It Works

1. **Core Seed** - Seeds core data (users, etc.) first
2. **Module Seeds** - Automatically discovers and runs seeds from all modules
3. **Auto-Discovery** - Finds seed files in `src/modules/[moduleName]/seeds/seed.ts`

## Creating a Module Seed File

### Step 1: Create Seeds Folder

Create a `seeds` folder in your module:

```
src/modules/[moduleName]/
├── seeds/
│   └── seed.ts
```

### Step 2: Create Seed File

Create `seeds/seed.ts` with a default export function:

```typescript
import { yourTable } from '../schemas/yourSchema';
import { users } from '@/core/lib/db/baseSchema';
import { eq } from 'drizzle-orm';
import type { db } from '@/core/lib/db';

/**
 * Seed function for your module
 * This is the default export that the seed loader expects
 */
export default async function seedYourModule(db: typeof db) {
  // Get demo users (created by core seed)
  const demoUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, 'user@example.com'))
    .limit(1);

  if (demoUsers.length === 0) {
    console.log('   ⚠️  No demo user found. Run core seed first.');
    return;
  }

  const userId = demoUsers[0].id;

  // Check if data already exists
  const existing = await db
    .select()
    .from(yourTable)
    .where(eq(yourTable.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    console.log('   ⚠️  Data already exists. Skipping seed.');
    return;
  }

  // Insert demo data
  const demoData = [
    {
      title: 'Demo Item 1',
      description: 'This is a demo item',
      userId,
    },
    // ... more items
  ];

  for (const item of demoData) {
    await db.insert(yourTable).values(item);
    console.log(`   ✅ Created: "${item.title}"`);
  }
}
```

## Running Seeds

### Run All Seeds

```bash
npm run seed
```

This will:
1. Seed core data (users)
2. Automatically discover and run all module seeds

### Seed File Requirements

- **Location**: `src/modules/[moduleName]/seeds/seed.ts`
- **Export**: Must have a default export function
- **Function Signature**: `async function seed(db: typeof db) => Promise<void>`
- **Dependencies**: Can import from your module schemas, services, etc.

## Best Practices

### 1. Check for Existing Data

Always check if data already exists before seeding to avoid duplicates:

```typescript
const existing = await db.select().from(yourTable).limit(1);
if (existing.length > 0) {
  console.log('   ⚠️  Data already exists. Skipping seed.');
  return;
}
```

### 2. Use Demo Users

Reference demo users created by the core seed:

```typescript
const demoUsers = await db
  .select()
  .from(users)
  .where(eq(users.email, 'user@example.com'))
  .limit(1);
```

### 3. Provide Clear Logging

Use console.log to show what's being created:

```typescript
console.log(`   ✅ Created: "${item.title}"`);
```

### 4. Handle Errors Gracefully

The seed system will continue with other modules even if one fails, but you can add try-catch if needed:

```typescript
try {
  // Seed logic
} catch (error) {
  console.error(`   ❌ Error: ${error.message}`);
  throw error; // Re-throw to let system handle it
}
```

## Example: Notes Module Seed

See `src/modules/notes/seeds/seed.ts` for a complete example.

## Seed Order

1. **Core seed** runs first (users, etc.)
2. **Module seeds** run after (in discovery order)

If your module depends on data from another module, you may need to:
- Use a specific user ID
- Check for dependencies before seeding
- Or manually run seeds in order

## Troubleshooting

### Seed Not Running

- Check file location: `src/modules/[moduleName]/seeds/seed.ts`
- Ensure default export exists
- Check console for errors

### Data Already Exists

- Seeds check for existing data and skip if found
- To re-seed, clear the table first or modify the check logic

### Module Not Found

- Ensure module folder doesn't start with `_` (underscore)
- Check that `seeds/seed.ts` file exists

## Advanced: Conditional Seeding

You can add conditions to your seed function:

```typescript
export default async function seedYourModule(db: typeof db) {
  // Only seed in development
  if (process.env.NODE_ENV === 'production') {
    console.log('   ⚠️  Skipping seed in production');
    return;
  }

  // Your seed logic
}
```

## Integration with CI/CD

Seeds are safe to run in development/staging environments. For production:
- Use migrations for schema changes
- Use seeds only for initial setup or test data
- Consider adding environment checks

