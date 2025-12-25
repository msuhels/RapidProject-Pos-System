import { and, desc, eq, ilike, isNull, or, gte, lte } from 'drizzle-orm';
import { db } from '@/core/lib/db';
import { stockAdjustments } from '../schemas/stockAdjustmentSchema';
import { products } from '../../products/schemas/productsSchema';
import { increaseProductQuantity, decreaseProductQuantity } from '../../products/services/productService';
import { logStockMovement } from './stockMovementService';
import type { StockAdjustment, CreateStockAdjustmentInput, UpdateStockAdjustmentInput, StockAdjustmentListFilters } from '../types';

export async function listStockAdjustments(
  tenantId: string,
  filters: StockAdjustmentListFilters = {},
): Promise<StockAdjustment[]> {
  const conditions = [eq(stockAdjustments.tenantId, tenantId), isNull(stockAdjustments.deletedAt)];

  if (filters.productId) {
    conditions.push(eq(stockAdjustments.productId, filters.productId));
  }

  if (filters.adjustmentType) {
    conditions.push(eq(stockAdjustments.adjustmentType, filters.adjustmentType));
  }

  if (filters.reason) {
    conditions.push(eq(stockAdjustments.reason, filters.reason));
  }

  if (filters.dateFrom) {
    conditions.push(gte(stockAdjustments.createdAt, new Date(filters.dateFrom)));
  }

  if (filters.dateTo) {
    conditions.push(lte(stockAdjustments.createdAt, new Date(filters.dateTo)));
  }

  // Join with products to get product names
  const results = await db
    .select({
      id: stockAdjustments.id,
      tenantId: stockAdjustments.tenantId,
      productId: stockAdjustments.productId,
      productName: products.name,
      adjustmentType: stockAdjustments.adjustmentType,
      quantity: stockAdjustments.quantity,
      previousQuantity: stockAdjustments.previousQuantity,
      newQuantity: stockAdjustments.newQuantity,
      reason: stockAdjustments.reason,
      notes: stockAdjustments.notes,
      createdAt: stockAdjustments.createdAt,
      updatedAt: stockAdjustments.updatedAt,
      createdBy: stockAdjustments.createdBy,
      updatedBy: stockAdjustments.updatedBy,
      deletedAt: stockAdjustments.deletedAt,
    })
    .from(stockAdjustments)
    .leftJoin(products, eq(stockAdjustments.productId, products.id))
    .where(and(...conditions))
    .orderBy(desc(stockAdjustments.createdAt));

  return results.map((r) => ({
    id: r.id,
    tenantId: r.tenantId,
    productId: r.productId,
    productName: r.productName || null,
    adjustmentType: r.adjustmentType as 'increase' | 'decrease',
    quantity: r.quantity,
    previousQuantity: r.previousQuantity,
    newQuantity: r.newQuantity,
    reason: r.reason,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    createdBy: r.createdBy,
    updatedBy: r.updatedBy,
    deletedAt: r.deletedAt?.toISOString() || null,
  }));
}

export async function getStockAdjustmentById(
  id: string,
  tenantId: string,
): Promise<StockAdjustment | null> {
  const result = await db
    .select({
      id: stockAdjustments.id,
      tenantId: stockAdjustments.tenantId,
      productId: stockAdjustments.productId,
      productName: products.name,
      adjustmentType: stockAdjustments.adjustmentType,
      quantity: stockAdjustments.quantity,
      previousQuantity: stockAdjustments.previousQuantity,
      newQuantity: stockAdjustments.newQuantity,
      reason: stockAdjustments.reason,
      notes: stockAdjustments.notes,
      createdAt: stockAdjustments.createdAt,
      updatedAt: stockAdjustments.updatedAt,
      createdBy: stockAdjustments.createdBy,
      updatedBy: stockAdjustments.updatedBy,
      deletedAt: stockAdjustments.deletedAt,
    })
    .from(stockAdjustments)
    .leftJoin(products, eq(stockAdjustments.productId, products.id))
    .where(and(eq(stockAdjustments.id, id), eq(stockAdjustments.tenantId, tenantId), isNull(stockAdjustments.deletedAt)))
    .limit(1);

  if (result.length === 0) return null;

  const r = result[0];
  return {
    id: r.id,
    tenantId: r.tenantId,
    productId: r.productId,
    productName: r.productName || null,
    adjustmentType: r.adjustmentType as 'increase' | 'decrease',
    quantity: r.quantity,
    previousQuantity: r.previousQuantity,
    newQuantity: r.newQuantity,
    reason: r.reason,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    createdBy: r.createdBy,
    updatedBy: r.updatedBy,
    deletedAt: r.deletedAt?.toISOString() || null,
  };
}

export async function createStockAdjustment(params: {
  data: CreateStockAdjustmentInput;
  tenantId: string;
  userId: string;
}): Promise<StockAdjustment> {
  const { data, tenantId, userId } = params;

  // Get current product quantity
  const { getProductById } = await import('../../products/services/productService');
  const product = await getProductById(data.productId, tenantId);
  if (!product) {
    throw new Error('Product not found');
  }

  const previousQuantity = parseInt(product.quantity) || 0;
  let newQuantity: number;

  if (data.adjustmentType === 'increase') {
    newQuantity = previousQuantity + data.quantity;
    await increaseProductQuantity(data.productId, tenantId, data.quantity, userId, 'adjustment', null);
  } else {
    newQuantity = Math.max(0, previousQuantity - data.quantity);
    if (newQuantity < 0) {
      throw new Error(`Insufficient stock. Available: ${previousQuantity}, Requested adjustment: ${data.quantity}`);
    }
    await decreaseProductQuantity(data.productId, tenantId, data.quantity, userId, 'adjustment', null);
  }

  // Create adjustment record
  const [result] = await db
    .insert(stockAdjustments)
    .values({
      tenantId,
      productId: data.productId,
      adjustmentType: data.adjustmentType,
      quantity: data.quantity.toString(),
      previousQuantity: previousQuantity.toString(),
      newQuantity: newQuantity.toString(),
      reason: data.reason,
      notes: data.notes || null,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  // Log stock movement
  try {
    await logStockMovement({
      productId: data.productId,
      tenantId,
      userId,
      movementType: 'adjustment',
      quantity: data.quantity,
      previousQuantity,
      newQuantity,
      reason: data.reason,
      referenceId: result.id,
      notes: data.notes,
    });
  } catch (error) {
    console.error('Failed to log stock movement:', error);
    // Don't fail the operation if logging fails
  }

  return getStockAdjustmentById(result.id, tenantId) as Promise<StockAdjustment>;
}

export async function updateStockAdjustment(params: {
  id: string;
  tenantId: string;
  userId: string;
  data: UpdateStockAdjustmentInput;
}): Promise<StockAdjustment | null> {
  const { id, tenantId, userId, data } = params;

  const existing = await getStockAdjustmentById(id, tenantId);
  if (!existing) return null;

  await db
    .update(stockAdjustments)
    .set({
      reason: data.reason ?? existing.reason,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(stockAdjustments.id, id), eq(stockAdjustments.tenantId, tenantId)));

  return getStockAdjustmentById(id, tenantId);
}

export async function deleteStockAdjustment(
  id: string,
  tenantId: string,
  userId: string,
): Promise<boolean> {
  const existing = await getStockAdjustmentById(id, tenantId);
  if (!existing) return false;

  // Reverse the adjustment
  const { getProductById } = await import('../../products/services/productService');
  const product = await getProductById(existing.productId, tenantId);
  if (product) {
    const currentQuantity = parseInt(product.quantity) || 0;
    if (existing.adjustmentType === 'increase') {
      // Reverse increase by decreasing
      await decreaseProductQuantity(existing.productId, tenantId, parseFloat(existing.quantity), userId, 'adjustment_reversal', id);
    } else {
      // Reverse decrease by increasing
      await increaseProductQuantity(existing.productId, tenantId, parseFloat(existing.quantity), userId, 'adjustment_reversal', id);
    }
  }

  // Soft delete the adjustment
  await db
    .update(stockAdjustments)
    .set({
      deletedAt: new Date(),
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(stockAdjustments.id, id), eq(stockAdjustments.tenantId, tenantId)));

  return true;
}

