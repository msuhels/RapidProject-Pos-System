import { db } from '@/core/lib/db';
import { modules } from '@/core/lib/db/baseSchema';
import { eq, or } from 'drizzle-orm';
import { registerOrderModule } from '../utils/moduleRegistration';

const MODULE_CODE = 'ORDERS';

/**
 * Seed function for orders module
 * This function is auto-discovered by scripts/seed.ts
 */
export default async function seed() {
  console.log(`🌱 Seeding orders module...`);

  // Find or create the module
  const existingModule = await db
    .select()
    .from(modules)
    .where(or(eq(modules.code, MODULE_CODE), eq(modules.code, MODULE_CODE.toLowerCase())))
    .limit(1);

  let moduleId: string;

  if (existingModule.length > 0) {
    moduleId = existingModule[0].id;
    console.log(`   ℹ️  Module ${MODULE_CODE} already exists`);
  } else {
    // Module should be created by the main seed script, but if it doesn't exist, create it
    const [newModule] = await db
      .insert(modules)
      .values({
        name: 'Orders',
        code: MODULE_CODE,
        description: 'Manage customer orders - track purchases, order dates, and product details',
        icon: 'MdOutlineInventory2',
        sortOrder: 8,
        isActive: true,
      })
      .returning();
    moduleId = newModule.id;
    console.log(`   ✅ Created module ${MODULE_CODE}`);
  }

  // Register permissions and fields
  await registerOrderModule();

  console.log(`✅ orders module seeded successfully\n`);
}

