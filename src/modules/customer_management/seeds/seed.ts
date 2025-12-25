import { db } from '@/core/lib/db';
import { modules, users, userRoles, roles, tenants } from '@/core/lib/db/baseSchema';
import { customers } from '../schemas/customerSchema';
import { eq, or, and, isNull } from 'drizzle-orm';
import { registerCustomerModule } from '../utils/moduleRegistration';
import { createCustomer } from '../services/customerService';

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

  // Create customers for all existing users with USER role
  console.log(`   📋 Creating customers for existing users with USER role...`);
  
  try {
    // Get all users with USER role
    const usersWithUserRole = await db
      .select({
        userId: users.id,
        userEmail: users.email,
        userFullName: users.fullName,
        userPhoneNumber: users.phoneNumber,
        tenantId: users.tenantId,
      })
      .from(users)
      .innerJoin(userRoles, eq(users.id, userRoles.userId))
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(roles.code, 'USER'),
          eq(userRoles.isActive, true),
          eq(roles.status, 'active'),
          isNull(users.deletedAt)
        )
      );

    if (usersWithUserRole.length > 0) {
      console.log(`   📊 Found ${usersWithUserRole.length} user(s) with USER role`);

      let createdCount = 0;
      let skippedCount = 0;

      for (const userData of usersWithUserRole) {
        // Only create customer if user has a tenant
        if (!userData.tenantId) {
          console.log(`   ⚠️  Skipping user ${userData.userEmail} - no tenant assigned`);
          skippedCount++;
          continue;
        }

        try {
          // Check if customer already exists for this user by userId
          const existingCustomerByUserId = await db
            .select()
            .from(customers)
            .where(
              and(
                eq(customers.userId, userData.userId),
                eq(customers.tenantId, userData.tenantId),
                isNull(customers.deletedAt)
              )
            )
            .limit(1);

          if (existingCustomerByUserId.length > 0) {
            skippedCount++;
            continue;
          }

          // Check if customer exists by email (to link existing customers to users)
          if (userData.userEmail) {
            const existingCustomerByEmail = await db
              .select()
              .from(customers)
              .where(
                and(
                  eq(customers.email, userData.userEmail),
                  eq(customers.tenantId, userData.tenantId),
                  isNull(customers.deletedAt)
                )
              )
              .limit(1);

            if (existingCustomerByEmail.length > 0) {
              // Update existing customer to link it to the user
              const existingCustomer = existingCustomerByEmail[0];
              await db
                .update(customers)
                .set({
                  userId: userData.userId,
                  updatedBy: userData.userId,
                  updatedAt: new Date(),
                })
                .where(eq(customers.id, existingCustomer.id));
              
              console.log(`   🔗 Linked existing customer "${existingCustomer.name}" to user ${userData.userEmail}`);
              createdCount++; // Count as updated
              continue;
            }
          }

          // Create new customer record
          await createCustomer({
            data: {
              name: userData.userFullName || userData.userEmail || 'Customer',
              email: userData.userEmail,
              phoneNumber: userData.userPhoneNumber || undefined,
              isActive: true,
            },
            tenantId: userData.tenantId,
            userId: userData.userId, // Use the user's own ID as creator
            linkedUserId: userData.userId,
          });
          createdCount++;
        } catch (error) {
          console.error(`   ❌ Failed to create customer for user ${userData.userEmail}:`, error);
          skippedCount++;
        }
      }

      console.log(`   ✅ Created ${createdCount} customer(s) for users with USER role`);
      if (skippedCount > 0) {
        console.log(`   ℹ️  Skipped ${skippedCount} user(s) (already have customers or no tenant)`);
      }
    } else {
      console.log(`   ℹ️  No users with USER role found`);
    }
  } catch (error) {
    console.error(`   ❌ Error creating customers for existing users:`, error);
    // Don't fail the entire seed if this fails
  }

  console.log(`✅ customer_management module seeded successfully\n`);
}


