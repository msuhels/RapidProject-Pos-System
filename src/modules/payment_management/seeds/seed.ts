import { db } from '@/core/lib/db';
import { modules, tenants } from '@/core/lib/db/baseSchema';
import { eq, or } from 'drizzle-orm';
import { registerPaymentModule } from '../utils/moduleRegistration';

const MODULE_CODE = 'PAYMENT_MANAGEMENT';

/**
 * Seed function for payment_management module
 * This function is auto-discovered by scripts/seed.ts
 * @param db - Optional database instance (if not provided, imports db directly)
 */
export default async function seed(db?: any) {
  console.log(`🌱 Seeding payment_management module...`);

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
        name: 'Payment Management',
        code: MODULE_CODE,
        description: 'Track all payments received against sales',
        icon: 'CreditCard',
        sortOrder: 12,
        isActive: true,
      })
      .returning();
    moduleId = newModule.id;
    console.log(`   ✅ Created module ${MODULE_CODE}`);
  }

  // Get default tenant for payment methods
  const defaultTenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, 'default'))
    .limit(1);

  const tenantId = defaultTenant.length > 0 ? defaultTenant[0].id : null;

  // Register permissions, fields, and default payment methods
  await registerPaymentModule(tenantId || undefined);

  console.log(`✅ payment_management module seeded successfully\n`);
}


