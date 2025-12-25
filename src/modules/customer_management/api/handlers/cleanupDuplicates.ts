import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission, isUserSuperAdmin } from '@/core/lib/permissions';
import { db } from '@/core/lib/db';
import { customers } from '../../schemas/customerSchema';
import { users } from '@/core/lib/db/baseSchema';
import { eq, and, isNull, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const tenantId = await getUserTenantId(userId);

    // Check permission (super admin with admin:* has access to everything)
    const hasPermission = await userHasPermission(userId, 'customer_management:delete') ||
      await userHasPermission(userId, 'customer_management:*') ||
      await userHasPermission(userId, 'admin:*');

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    if (!tenantId) {
      const isSuperAdmin = await isUserSuperAdmin(userId);
      if (!isSuperAdmin) {
        return NextResponse.json({ error: 'Tenant not found for user' }, { status: 400 });
      }
    }

    // Find duplicate customers (same email or name in same tenant)
    const duplicateGroups = await db
      .select({
        email: customers.email,
        name: customers.name,
        tenantId: customers.tenantId,
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(customers)
      .where(
        and(
          tenantId ? eq(customers.tenantId, tenantId) : sql`true`,
          isNull(customers.deletedAt)
        )
      )
      .groupBy(customers.email, customers.name, customers.tenantId)
      .having(sql`COUNT(*) > 1`);

    const results = {
      merged: 0,
      deleted: 0,
      errors: [] as string[],
    };

    for (const group of duplicateGroups) {
      try {
        // Get all customers in this duplicate group
        const duplicateCustomers = await db
          .select()
          .from(customers)
          .where(
            and(
              group.email ? eq(customers.email, group.email) : sql`true`,
              eq(customers.name, group.name),
              group.tenantId ? eq(customers.tenantId, group.tenantId) : sql`true`,
              isNull(customers.deletedAt)
            )
          )
          .orderBy(customers.createdAt); // Keep the oldest one

        if (duplicateCustomers.length <= 1) continue;

        // Keep the first one (oldest), merge/delete the rest
        const keepCustomer = duplicateCustomers[0];
        const duplicatesToRemove = duplicateCustomers.slice(1);

        // If keepCustomer doesn't have userId, try to find one from duplicates
        if (!keepCustomer.userId) {
          for (const dup of duplicatesToRemove) {
            if (dup.userId) {
              // Update keepCustomer with userId
              await db
                .update(customers)
                .set({
                  userId: dup.userId,
                  updatedBy: userId,
                  updatedAt: new Date(),
                })
                .where(eq(customers.id, keepCustomer.id));
              break;
            }
          }
        }

        // Soft delete duplicates
        for (const dup of duplicatesToRemove) {
          await db
            .update(customers)
            .set({
              deletedAt: new Date(),
              updatedBy: userId,
              updatedAt: new Date(),
            })
            .where(eq(customers.id, dup.id));
          results.deleted++;
        }

        results.merged++;
      } catch (error) {
        results.errors.push(`Failed to merge duplicates for ${group.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...results,
        message: `Cleaned up ${results.merged} duplicate group(s), deleted ${results.deleted} duplicate customer(s)`,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Cleanup duplicates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

