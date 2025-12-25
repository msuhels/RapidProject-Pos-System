import { and, desc, eq, isNull, gte, lte } from 'drizzle-orm';
import { db } from '@/core/lib/db';
import { stockMovements } from '../schemas/stockMovementSchema';

export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  movementType: 'increase' | 'decrease' | 'adjustment';
  quantity: string;
  previousQuantity: string;
  newQuantity: string;
  reason: string | null;
  referenceId: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface CreateStockMovementInput {
  productId: string;
  tenantId: string;
  userId: string;
  movementType: 'increase' | 'decrease' | 'adjustment';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  referenceId?: string | null;
  notes?: string;
}

export interface StockMovementFilters {
  productId?: string;
  movementType?: 'increase' | 'decrease' | 'adjustment';
  reason?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function logStockMovement(
  params: CreateStockMovementInput,
): Promise<StockMovement> {
  const { productId, tenantId, userId, movementType, quantity, previousQuantity, newQuantity, reason, referenceId, notes } = params;

  const [result] = await db
    .insert(stockMovements)
    .values({
      tenantId,
      productId,
      movementType,
      quantity: quantity.toString(),
      previousQuantity: previousQuantity.toString(),
      newQuantity: newQuantity.toString(),
      reason: reason || null,
      referenceId: referenceId || null,
      notes: notes || null,
      createdBy: userId,
    })
    .returning();

  return {
    id: result.id,
    tenantId: result.tenantId,
    productId: result.productId,
    movementType: result.movementType as 'increase' | 'decrease' | 'adjustment',
    quantity: result.quantity,
    previousQuantity: result.previousQuantity,
    newQuantity: result.newQuantity,
    reason: result.reason,
    referenceId: result.referenceId,
    notes: result.notes,
    createdBy: result.createdBy,
    createdAt: result.createdAt.toISOString(),
  };
}

export async function listStockMovements(
  tenantId: string,
  filters: StockMovementFilters = {},
): Promise<StockMovement[]> {
  const conditions = [eq(stockMovements.tenantId, tenantId)];

  if (filters.productId) {
    conditions.push(eq(stockMovements.productId, filters.productId));
  }

  if (filters.movementType) {
    conditions.push(eq(stockMovements.movementType, filters.movementType));
  }

  if (filters.reason) {
    conditions.push(eq(stockMovements.reason, filters.reason));
  }

  if (filters.dateFrom) {
    conditions.push(gte(stockMovements.createdAt, new Date(filters.dateFrom)));
  }

  if (filters.dateTo) {
    conditions.push(lte(stockMovements.createdAt, new Date(filters.dateTo)));
  }

  const results = await db
    .select()
    .from(stockMovements)
    .where(and(...conditions))
    .orderBy(desc(stockMovements.createdAt));

  return results.map((r) => ({
    id: r.id,
    tenantId: r.tenantId,
    productId: r.productId,
    movementType: r.movementType as 'increase' | 'decrease' | 'adjustment',
    quantity: r.quantity,
    previousQuantity: r.previousQuantity,
    newQuantity: r.newQuantity,
    reason: r.reason,
    referenceId: r.referenceId,
    notes: r.notes,
    createdBy: r.createdBy,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getStockMovementsByProduct(
  productId: string,
  tenantId: string,
): Promise<StockMovement[]> {
  return listStockMovements(tenantId, { productId });
}

