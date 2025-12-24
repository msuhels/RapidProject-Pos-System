import { db } from '@/core/lib/db';
import { customers } from '../schemas/customerSchema';
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
    conditions.push(
      or(
        like(sql`LOWER(${customers.name})`, searchTerm),
        like(sql`LOWER(${customers.phoneNumber})`, searchTerm),
        like(sql`LOWER(${customers.email})`, searchTerm),
        // Search in custom fields JSONB (text-like values only)
        sql`EXISTS (
          SELECT 1 FROM jsonb_each_text(${customers.customFields}) 
          WHERE LOWER(value) LIKE ${searchTerm}
        )`,
      ),
    );
  }

  const results = await db
    .select()
    .from(customers)
    .where(and(...conditions))
    .orderBy(desc(customers.createdAt));

  return results.map((row) => ({
    id: row.id,
    tenantId: row.tenantId,
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
}): Promise<CustomerRecord> {
  const { data, tenantId, userId } = params;

  const [newCustomer] = await db
    .insert(customers)
    .values({
      tenantId,
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

