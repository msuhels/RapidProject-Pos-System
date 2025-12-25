import { db } from '@/core/lib/db';
import { modules, permissions } from '@/core/lib/db/baseSchema';
import { eq, or } from 'drizzle-orm';
import { REPORT_PERMISSIONS } from '../config/permissions.config';

const MODULE_CODE = 'REPORTS';

/**
 * Seed function for reports module
 * This function is auto-discovered by scripts/seed.ts
 */
export default async function seed() {
  console.log(`🌱 Seeding reports module...`);

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
    const [newModule] = await db
      .insert(modules)
      .values({
        name: 'Reports',
        code: MODULE_CODE,
        description: 'Business insights through read-only reports derived from order data',
        icon: 'BarChart3',
        sortOrder: 9,
        isActive: true,
      })
      .returning();
    moduleId = newModule.id;
    console.log(`   ✅ Created module ${MODULE_CODE}`);
  }

  // Register permissions (read-only module, no create/update/delete)
  for (const perm of REPORT_PERMISSIONS) {
    const existing = await db
      .select()
      .from(permissions)
      .where(eq(permissions.code, perm.code))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(permissions).values({
        code: perm.code,
        name: perm.name,
        description: perm.description,
        moduleId: moduleId,
        isDangerous: perm.isDangerous || false,
        requiresMfa: perm.requiresMfa || false,
      });
      console.log(`   ✅ Registered permission: ${perm.code}`);
    } else {
      console.log(`   ℹ️  Permission ${perm.code} already exists`);
    }
  }

  console.log(`✅ reports module seeded successfully\n`);
}

