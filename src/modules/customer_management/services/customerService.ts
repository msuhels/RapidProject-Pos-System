import { db } from '@/core/lib/db';
import { customers } from '../schemas/customerSchema';
import { users } from '@/core/lib/db/baseSchema';
import { eq, and, or, isNull, sql, like, gte, desc } from 'drizzle-orm';
import type {
  CustomerRecord,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerListFilters,
} from '../types';

export async function listCustomers(
  tenantId: string,
  filters: CustomerListFilters = {},
): Promise<CustomerRecord[]> {
  const { search, isActive, hasOutstandingBalance } = filters;

  // Build conditions array
  const conditions = [eq(customers.tenantId, tenantId), isNull(customers.deletedAt)];

  // Filter by active/inactive
  if (isActive !== undefined) {
    conditions.push(eq(customers.isActive, isActive));
  }

  // Filter by outstanding balance > 0
  if (hasOutstandingBalance === true) {
    conditions.push(gte(customers.outstandingBalance, '0.01'));
  }

  // Search across name, phone, email, and custom fields
  if (search) {
    const searchTerm = `%${search.toLowerCase()}%`;
    const searchConditions = or(
      like(sql`LOWER(${customers.name})`, searchTerm),
      like(sql`LOWER(${customers.phoneNumber})`, searchTerm),
      like(sql`LOWER(${customers.email})`, searchTerm),
      // Search in custom fields JSONB (text-like values only)
      sql`EXISTS (
        SELECT 1 FROM jsonb_each_text(${customers.customFields}) 
        WHERE LOWER(value) LIKE ${searchTerm}
      )`,
    );
    if (searchConditions) {
      conditions.push(searchConditions);
    }
  }

  const results = await db
    .select()
    .from(customers)
    .where(and(...conditions))
    .orderBy(desc(customers.createdAt));

  return results.map((row) => ({
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId || null,
    name: row.name,
    phoneNumber: row.phoneNumber,
    email: row.email,
    totalPurchases: parseFloat(row.totalPurchases || '0'),
    outstandingBalance: parseFloat(row.outstandingBalance || '0'),
    isActive: row.isActive,
    customFields: (row.customFields as Record<string, unknown>) || {},
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() || null,
    createdBy: row.createdBy || null,
    updatedBy: row.updatedBy || null,
  }));
}

export async function getCustomerById(
  id: string,
  tenantId: string,
): Promise<CustomerRecord | null> {
  const results = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId), isNull(customers.deletedAt)))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  const row = results[0];
  return {
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId || null,
    name: row.name,
    phoneNumber: row.phoneNumber,
    email: row.email,
    totalPurchases: parseFloat(row.totalPurchases || '0'),
    outstandingBalance: parseFloat(row.outstandingBalance || '0'),
    isActive: row.isActive,
    customFields: (row.customFields as Record<string, unknown>) || {},
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() || null,
    createdBy: row.createdBy || null,
    updatedBy: row.updatedBy || null,
  };
}

export async function createCustomer(params: {
  data: CreateCustomerInput;
  tenantId: string;
  userId: string;
  linkedUserId?: string | null;
}): Promise<CustomerRecord> {
  const { data, tenantId, userId, linkedUserId } = params;

  const [newCustomer] = await db
    .insert(customers)
    .values({
      tenantId,
      userId: linkedUserId || null,
      name: data.name,
      phoneNumber: data.phoneNumber || null,
      email: data.email || null,
      totalPurchases: (data.totalPurchases || 0).toString(),
      outstandingBalance: (data.outstandingBalance || 0).toString(),
      isActive: data.isActive !== undefined ? data.isActive : true,
      customFields: data.customFields || {},
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return {
    id: newCustomer.id,
    tenantId: newCustomer.tenantId,
    userId: newCustomer.userId || null,
    name: newCustomer.name,
    phoneNumber: newCustomer.phoneNumber,
    email: newCustomer.email,
    totalPurchases: parseFloat(newCustomer.totalPurchases || '0'),
    outstandingBalance: parseFloat(newCustomer.outstandingBalance || '0'),
    isActive: newCustomer.isActive,
    customFields: (newCustomer.customFields as Record<string, unknown>) || {},
    createdAt: newCustomer.createdAt.toISOString(),
    updatedAt: newCustomer.updatedAt.toISOString(),
    deletedAt: newCustomer.deletedAt?.toISOString() || null,
    createdBy: newCustomer.createdBy || null,
    updatedBy: newCustomer.updatedBy || null,
  };
}

export async function updateCustomer(params: {
  id: string;
  tenantId: string;
  userId: string;
  data: UpdateCustomerInput;
}): Promise<CustomerRecord | null> {
  const { id, tenantId, userId, data } = params;

  const updateData: any = {
    updatedBy: userId,
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber || null;
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.totalPurchases !== undefined) updateData.totalPurchases = data.totalPurchases.toString();
  if (data.outstandingBalance !== undefined) updateData.outstandingBalance = data.outstandingBalance.toString();
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.customFields !== undefined) updateData.customFields = data.customFields;

  const [updated] = await db
    .update(customers)
    .set(updateData)
    .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId), isNull(customers.deletedAt)))
    .returning();

  if (!updated) {
    return null;
  }

  return {
    id: updated.id,
    tenantId: updated.tenantId,
    userId: updated.userId || null,
    name: updated.name,
    phoneNumber: updated.phoneNumber,
    email: updated.email,
    totalPurchases: parseFloat(updated.totalPurchases || '0'),
    outstandingBalance: parseFloat(updated.outstandingBalance || '0'),
    isActive: updated.isActive,
    customFields: (updated.customFields as Record<string, unknown>) || {},
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    deletedAt: updated.deletedAt?.toISOString() || null,
    createdBy: updated.createdBy || null,
    updatedBy: updated.updatedBy || null,
  };
}

export async function deleteCustomer(
  id: string,
  tenantId: string,
  userId: string,
  hardDelete: boolean = false,
): Promise<boolean> {
  // Check if customer has sales history (prevent hard delete if exists)
  // For now, we'll implement soft delete (deactivation) by default
  // In a real system, you'd check a sales/transactions table
  
  if (hardDelete) {
    // Hard delete - only if no sales history exists
    const deleted = await db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
      .returning();

    return deleted.length > 0;
  } else {
    // Soft delete - deactivate customer
    const [updated] = await db
      .update(customers)
      .set({
        isActive: false,
        deletedAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId), isNull(customers.deletedAt)))
      .returning();

    return updated !== undefined;
  }
}

/**
 * Get customer by user ID
 */
export async function getCustomerByUserId(
  userId: string,
  tenantId: string,
): Promise<CustomerRecord | null> {
  const results = await db
    .select()
    .from(customers)
    .where(and(eq(customers.userId, userId), eq(customers.tenantId, tenantId), isNull(customers.deletedAt)))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  const row = results[0];
  return {
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId || null,
    name: row.name,
    phoneNumber: row.phoneNumber,
    email: row.email,
    totalPurchases: parseFloat(row.totalPurchases || '0'),
    outstandingBalance: parseFloat(row.outstandingBalance || '0'),
    isActive: row.isActive,
    customFields: (row.customFields as Record<string, unknown>) || {},
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() || null,
    createdBy: row.createdBy || null,
    updatedBy: row.updatedBy || null,
  };
}

/**
 * Get customer sales history (orders)
 * @param customerId - Customer ID
 * @param tenantId - Tenant ID (optional for super admin)
 */
export async function getCustomerSalesHistory(
  customerId: string,
  tenantId: string | null,
): Promise<any[]> {
  // First get the customer to find the linked userId
  // For super admin, we can get customer without tenant restriction
  let customer: CustomerRecord | null;
  
  if (tenantId) {
    customer = await getCustomerById(customerId, tenantId);
  } else {
    // Super admin case - get customer by ID only
    const results = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, customerId), isNull(customers.deletedAt)))
      .limit(1);

    if (results.length === 0) {
      return [];
    }

    const row = results[0];
    customer = {
      id: row.id,
      tenantId: row.tenantId,
      userId: row.userId || null,
      name: row.name,
      phoneNumber: row.phoneNumber,
      email: row.email,
      totalPurchases: parseFloat(row.totalPurchases || '0'),
      outstandingBalance: parseFloat(row.outstandingBalance || '0'),
      isActive: row.isActive,
      customFields: (row.customFields as Record<string, unknown>) || {},
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      deletedAt: row.deletedAt?.toISOString() || null,
      createdBy: row.createdBy || null,
      updatedBy: row.updatedBy || null,
    };
  }

  if (!customer || !customer.userId) {
    return [];
  }

  // Use customer's tenantId for orders query
  const ordersTenantId = customer.tenantId;

  // Get orders for this user
  const { listOrdersForTenant } = await import('../../orders/services/orderService');
  const orders = await listOrdersForTenant(ordersTenantId, {
    userId: customer.userId,
  });

  // Enrich orders with product names
  const { products } = await import('../../products/schemas/productsSchema');
  const { getProductById } = await import('../../products/services/productService');
  
  const enrichedOrders = await Promise.all(
    orders.map(async (order) => {
      const enrichedProducts = await Promise.all(
        (order.products || []).map(async (product: any) => {
          try {
            const productInfo = await getProductById(product.productId, ordersTenantId);
            return {
              ...product,
              productName: productInfo?.name || product.productId,
            };
          } catch {
            return {
              ...product,
              productName: product.productId,
            };
          }
        })
      );
      return {
        ...order,
        products: enrichedProducts,
      };
    })
  );

  return enrichedOrders;
}

/**
 * Recalculate and update customer's totalPurchases based on all their orders
 * Useful for fixing data inconsistencies
 */
export async function recalculateCustomerTotalPurchases(
  customerId: string,
  tenantId: string,
): Promise<number> {
  const customer = await getCustomerById(customerId, tenantId);
  if (!customer || !customer.userId) {
    throw new Error('Customer not found or not linked to a user');
  }

  // Get all orders for this customer
  const { listOrdersForTenant } = await import('../../orders/services/orderService');
  const orders = await listOrdersForTenant(tenantId, {
    userId: customer.userId,
  });

  // Calculate total from all orders
  const totalPurchases = orders.reduce((sum, order) => {
    return sum + (parseFloat(order.totalAmount || '0') || 0);
  }, 0);

  // Update customer record
  await updateCustomer({
    id: customerId,
    tenantId,
    userId: customer.createdBy || customer.id, // Use creator or customer ID as fallback
    data: {
      totalPurchases,
    },
  });

  return totalPurchases;
}

/**
 * Recalculate totalPurchases for all customers in a tenant
 */
export async function recalculateAllCustomerTotals(
  tenantId: string,
  userId: string,
): Promise<{ updated: number; failed: number; errors: string[] }> {
  const results = {
    updated: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Get all customers for this tenant
  const allCustomers = await listCustomers(tenantId, {});

  for (const customer of allCustomers) {
    try {
      if (!customer.userId) {
        // Try to find user by email and link them
        if (customer.email) {
          const { users } = await import('@/core/lib/db/baseSchema');
          const userByEmail = await db
            .select()
            .from(users)
            .where(
              and(
                eq(users.email, customer.email),
                eq(users.tenantId, tenantId),
                isNull(users.deletedAt)
              )
            )
            .limit(1);

          if (userByEmail.length > 0) {
            // Link customer to user
            await db
              .update(customers)
              .set({
                userId: userByEmail[0].id,
                updatedBy: userId,
                updatedAt: new Date(),
              })
              .where(eq(customers.id, customer.id));
            
            // Update customer object for calculation
            customer.userId = userByEmail[0].id;
          }
        }

        if (!customer.userId) {
          results.failed++;
          results.errors.push(`Customer ${customer.name} (${customer.id}) is not linked to a user and no matching user found by email`);
          continue;
        }
      }

      // Get all orders for this customer
      const { listOrdersForTenant } = await import('../../orders/services/orderService');
      const orders = await listOrdersForTenant(tenantId, {
        userId: customer.userId,
      });

      // Calculate total from all orders
      const totalPurchases = orders.reduce((sum, order) => {
        return sum + (parseFloat(order.totalAmount || '0') || 0);
      }, 0);

      // Update customer record
      await updateCustomer({
        id: customer.id,
        tenantId,
        userId,
        data: {
          totalPurchases,
        },
      });

      results.updated++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to update customer ${customer.name} (${customer.id}): ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return results;
}

