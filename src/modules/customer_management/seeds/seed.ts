import { db } from '@/core/lib/db';
import { modules } from '@/core/lib/db/baseSchema';
import { eq, or } from 'drizzle-orm';
import { registerCustomerModule } from '../utils/moduleRegistration';

const MODULE_CODE = 'CUSTOMER_MANAGEMENT';

/**
 * Seed function for customer_management module
 * This function is auto-discovered by scripts/seed.ts
 * @param db - Optional database instance (if not provided, imports db directly)
 */
export default async function seed(db?: any) {
  console.log(`🌱 Seeding customer_management module...`);

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
        name: 'Customer Management',
        code: MODULE_CODE,
        description: 'Maintain customer records, contact details, and purchase history',
        icon: 'Users',
        sortOrder: 10,
        isActive: true,
      })
      .returning();
    moduleId = newModule.id;
    console.log(`   ✅ Created module ${MODULE_CODE}`);
  }

  // Register permissions and fields
  await registerCustomerModule();

  console.log(`✅ customer_management module seeded successfully\n`);
}


