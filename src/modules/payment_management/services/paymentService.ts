import { db } from '@/core/lib/db';
import { payments, paymentMethods } from '../schemas/paymentSchema';
import { eq, and, or, isNull, sql, like, gte, lte, desc } from 'drizzle-orm';
import type {
  Payment,
  CreatePaymentInput,
  UpdatePaymentInput,
  PaymentListFilters,
  PaymentMethod,
  CreatePaymentMethodInput,
  UpdatePaymentMethodInput,
  PaymentStatus,
} from '../types';

/**
 * Calculate total payments for a sale (non-reversed only)
 */
async function calculateSalePayments(saleReference: string, tenantId: string): Promise<number> {
  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.tenantId, tenantId),
        eq(payments.saleReference, saleReference),
        eq(payments.isReversed, false),
      ),
    );

  return parseFloat(result[0]?.total?.toString() || '0');
}

export async function listPayments(
  tenantId: string,
  filters: PaymentListFilters = {},
): Promise<Payment[]> {
  const { search, paymentStatus, paymentMethodId, saleReference, dateFrom, dateTo } = filters;

  // Build conditions array
  const conditions = [eq(payments.tenantId, tenantId)];

  // Filter by payment status
  if (paymentStatus) {
    conditions.push(eq(payments.paymentStatus, paymentStatus));
  }

  // Filter by payment method
  if (paymentMethodId) {
    conditions.push(eq(payments.paymentMethodId, paymentMethodId));
  }

  // Filter by sale reference
  if (saleReference) {
    conditions.push(eq(payments.saleReference, saleReference));
  }

  // Filter by date range
  if (dateFrom) {
    conditions.push(gte(payments.paymentDate, new Date(dateFrom)));
  }
  if (dateTo) {
    conditions.push(lte(payments.paymentDate, new Date(dateTo)));
  }

  // Search across sale_reference, transaction_reference, and custom fields
  if (search) {
    const searchTerm = `%${search.toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`LOWER(${payments.saleReference})`, searchTerm),
        like(sql`LOWER(${payments.transactionReference})`, searchTerm),
        // Search in custom fields JSONB (text-like values only)
        sql`EXISTS (
          SELECT 1 FROM jsonb_each_text(${payments.customFields}) 
          WHERE LOWER(value) LIKE ${searchTerm}
        )`,
      ),
    );
  }

  const results = await db
    .select({
      payment: payments,
      paymentMethod: paymentMethods,
    })
    .from(payments)
    .leftJoin(paymentMethods, eq(payments.paymentMethodId, paymentMethods.id))
    .where(and(...conditions))
    .orderBy(desc(payments.paymentDate));

  return results.map((row) => ({
    id: row.payment.id,
    tenantId: row.payment.tenantId,
    saleReference: row.payment.saleReference,
    paymentMethodId: row.payment.paymentMethodId,
    amount: parseFloat(row.payment.amount || '0'),
    paymentStatus: row.payment.paymentStatus as PaymentStatus,
    transactionReference: row.payment.transactionReference,
    paymentDate: row.payment.paymentDate.toISOString(),
    notes: row.payment.notes,
    isReversed: row.payment.isReversed,
    reversedBy: row.payment.reversedBy || null,
    reversedAt: row.payment.reversedAt?.toISOString() || null,
    customFields: (row.payment.customFields as Record<string, unknown>) || {},
    createdAt: row.payment.createdAt.toISOString(),
    updatedAt: row.payment.updatedAt.toISOString(),
    createdBy: row.payment.createdBy || null,
    updatedBy: row.payment.updatedBy || null,
    paymentMethod: row.paymentMethod
      ? {
          id: row.paymentMethod.id,
          tenantId: row.paymentMethod.tenantId,
          name: row.paymentMethod.name,
          isActive: row.paymentMethod.isActive,
          supportsRefund: row.paymentMethod.supportsRefund,
          createdAt: row.paymentMethod.createdAt.toISOString(),
          updatedAt: row.paymentMethod.updatedAt.toISOString(),
        }
      : undefined,
  }));
}

export async function getPaymentById(
  id: string,
  tenantId: string,
): Promise<Payment | null> {
  const results = await db
    .select({
      payment: payments,
      paymentMethod: paymentMethods,
    })
    .from(payments)
    .leftJoin(paymentMethods, eq(payments.paymentMethodId, paymentMethods.id))
    .where(and(eq(payments.id, id), eq(payments.tenantId, tenantId)))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  const row = results[0];
  return {
    id: row.payment.id,
    tenantId: row.payment.tenantId,
    saleReference: row.payment.saleReference,
    paymentMethodId: row.payment.paymentMethodId,
    amount: parseFloat(row.payment.amount || '0'),
    paymentStatus: row.payment.paymentStatus as PaymentStatus,
    transactionReference: row.payment.transactionReference,
    paymentDate: row.payment.paymentDate.toISOString(),
    notes: row.payment.notes,
    isReversed: row.payment.isReversed,
    reversedBy: row.payment.reversedBy || null,
    reversedAt: row.payment.reversedAt?.toISOString() || null,
    customFields: (row.payment.customFields as Record<string, unknown>) || {},
    createdAt: row.payment.createdAt.toISOString(),
    updatedAt: row.payment.updatedAt.toISOString(),
    createdBy: row.payment.createdBy || null,
    updatedBy: row.payment.updatedBy || null,
    paymentMethod: row.paymentMethod
      ? {
          id: row.paymentMethod.id,
          tenantId: row.paymentMethod.tenantId,
          name: row.paymentMethod.name,
          isActive: row.paymentMethod.isActive,
          supportsRefund: row.paymentMethod.supportsRefund,
          createdAt: row.paymentMethod.createdAt.toISOString(),
          updatedAt: row.paymentMethod.updatedAt.toISOString(),
        }
      : undefined,
  };
}

export async function createPayment(params: {
  data: CreatePaymentInput;
  tenantId: string;
  userId: string;
}): Promise<Payment> {
  const { data, tenantId, userId } = params;

  // Validate payment method exists and is active
  const [method] = await db
    .select()
    .from(paymentMethods)
    .where(
      and(
        eq(paymentMethods.id, data.paymentMethodId),
        eq(paymentMethods.tenantId, tenantId),
        eq(paymentMethods.isActive, true),
      ),
    )
    .limit(1);

  if (!method) {
    throw new Error('Payment method not found or inactive');
  }

  // Check for duplicate transaction reference (idempotency)
  if (data.transactionReference) {
    const existing = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.tenantId, tenantId),
          eq(payments.transactionReference, data.transactionReference),
          eq(payments.isReversed, false),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error('Payment with this transaction reference already exists');
    }
  }

  // Determine payment status if not provided
  let paymentStatus = data.paymentStatus;
  if (!paymentStatus) {
    // In a real system, you'd check the sale balance here
    // For now, default to 'paid'
    paymentStatus = 'paid';
  }

  const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();

  const [newPayment] = await db
    .insert(payments)
    .values({
      tenantId,
      saleReference: data.saleReference,
      paymentMethodId: data.paymentMethodId,
      amount: data.amount.toString(),
      paymentStatus,
      transactionReference: data.transactionReference || null,
      paymentDate,
      notes: data.notes || null,
      customFields: data.customFields || {},
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  // Fetch with payment method
  const payment = await getPaymentById(newPayment.id, tenantId);
  return payment!;
}

export async function updatePayment(params: {
  id: string;
  tenantId: string;
  userId: string;
  data: UpdatePaymentInput;
}): Promise<Payment | null> {
  const { id, tenantId, userId, data } = params;

  // Get existing payment
  const existing = await getPaymentById(id, tenantId);
  if (!existing) {
    return null;
  }

  // Prevent updates to reversed payments
  if (existing.isReversed) {
    throw new Error('Cannot update a reversed payment');
  }

  // Prevent updates to refunded payments
  if (existing.paymentStatus === 'refunded') {
    throw new Error('Cannot update a refunded payment');
  }

  const updateData: any = {
    updatedBy: userId,
    updatedAt: new Date(),
  };

  if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
  if (data.amount !== undefined) updateData.amount = data.amount.toString();
  if (data.transactionReference !== undefined) updateData.transactionReference = data.transactionReference || null;
  if (data.paymentDate !== undefined) updateData.paymentDate = new Date(data.paymentDate);
  if (data.notes !== undefined) updateData.notes = data.notes || null;
  if (data.customFields !== undefined) updateData.customFields = data.customFields;

  await db
    .update(payments)
    .set(updateData)
    .where(and(eq(payments.id, id), eq(payments.tenantId, tenantId)));

  // Fetch updated payment
  return await getPaymentById(id, tenantId);
}

export async function reversePayment(
  id: string,
  tenantId: string,
  userId: string,
): Promise<Payment | null> {
  // Get existing payment
  const existing = await getPaymentById(id, tenantId);
  if (!existing) {
    return null;
  }

  // Prevent reversing already reversed payments
  if (existing.isReversed) {
    throw new Error('Payment is already reversed');
  }

  // Mark as reversed
  await db
    .update(payments)
    .set({
      isReversed: true,
      reversedBy: userId,
      reversedAt: new Date(),
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(payments.id, id), eq(payments.tenantId, tenantId)));

  // Fetch updated payment
  return await getPaymentById(id, tenantId);
}

export async function getPaymentsBySale(
  saleReference: string,
  tenantId: string,
): Promise<Payment[]> {
  return listPayments(tenantId, { search: saleReference });
}

// Payment Methods CRUD
export async function listPaymentMethods(tenantId: string): Promise<PaymentMethod[]> {
  const results = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.tenantId, tenantId))
    .orderBy(paymentMethods.name);

  return results.map((row) => ({
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    isActive: row.isActive,
    supportsRefund: row.supportsRefund,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function getPaymentMethodById(
  id: string,
  tenantId: string,
): Promise<PaymentMethod | null> {
  const results = await db
    .select()
    .from(paymentMethods)
    .where(and(eq(paymentMethods.id, id), eq(paymentMethods.tenantId, tenantId)))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  const row = results[0];
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    isActive: row.isActive,
    supportsRefund: row.supportsRefund,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createPaymentMethod(params: {
  data: CreatePaymentMethodInput;
  tenantId: string;
}): Promise<PaymentMethod> {
  const { data, tenantId } = params;

  // Check for duplicate name
  const existing = await db
    .select()
    .from(paymentMethods)
    .where(
      and(
        eq(paymentMethods.tenantId, tenantId),
        eq(paymentMethods.name, data.name),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error('Payment method with this name already exists');
  }

  const [newMethod] = await db
    .insert(paymentMethods)
    .values({
      tenantId,
      name: data.name,
      isActive: data.isActive !== undefined ? data.isActive : true,
      supportsRefund: data.supportsRefund !== undefined ? data.supportsRefund : true,
    })
    .returning();

  return {
    id: newMethod.id,
    tenantId: newMethod.tenantId,
    name: newMethod.name,
    isActive: newMethod.isActive,
    supportsRefund: newMethod.supportsRefund,
    createdAt: newMethod.createdAt.toISOString(),
    updatedAt: newMethod.updatedAt.toISOString(),
  };
}

export async function updatePaymentMethod(params: {
  id: string;
  tenantId: string;
  data: UpdatePaymentMethodInput;
}): Promise<PaymentMethod | null> {
  const { id, tenantId, data } = params;

  // Check for duplicate name if name is being updated
  if (data.name) {
    const existing = await db
      .select()
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.tenantId, tenantId),
          eq(paymentMethods.name, data.name),
        ),
      )
      .limit(1);

    if (existing.length > 0 && existing[0].id !== id) {
      throw new Error('Payment method with this name already exists');
    }
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.supportsRefund !== undefined) updateData.supportsRefund = data.supportsRefund;

  const [updated] = await db
    .update(paymentMethods)
    .set(updateData)
    .where(and(eq(paymentMethods.id, id), eq(paymentMethods.tenantId, tenantId)))
    .returning();

  if (!updated) {
    return null;
  }

  return {
    id: updated.id,
    tenantId: updated.tenantId,
    name: updated.name,
    isActive: updated.isActive,
    supportsRefund: updated.supportsRefund,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deletePaymentMethod(
  id: string,
  tenantId: string,
): Promise<boolean> {
  // Check if payment method is used in any payments
  const usedInPayments = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.paymentMethodId, id),
        eq(payments.tenantId, tenantId),
        eq(payments.isReversed, false),
      ),
    )
    .limit(1);

  if (usedInPayments.length > 0) {
    throw new Error('Cannot delete payment method that is used in payments');
  }

  const deleted = await db
    .delete(paymentMethods)
    .where(and(eq(paymentMethods.id, id), eq(paymentMethods.tenantId, tenantId)))
    .returning();

  return deleted.length > 0;
}


