import { and, desc, eq, ilike, isNull, or, gte, lte } from 'drizzle-orm';
import { db } from '@/core/lib/db';
import { orders } from '../schemas/ordersSchema';
import { products } from '../../products/schemas/productsSchema';
import { decreaseProductQuantity } from '../../products/services/productService';
import type { Order, CreateOrderInput, UpdateOrderInput, OrderListFilters } from '../types';

export async function listOrdersForTenant(
  tenantId: string,
  filters: OrderListFilters = {},
): Promise<Order[]> {
  const conditions = [eq(orders.tenantId, tenantId), isNull(orders.deletedAt)];

  if (filters.userId) {
    conditions.push(eq(orders.userId, filters.userId));
  }

  if (filters.dateFrom) {
    conditions.push(gte(orders.orderDate, new Date(filters.dateFrom)));
  }

  if (filters.dateTo) {
    conditions.push(lte(orders.orderDate, new Date(filters.dateTo)));
  }

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(orders.userId, searchTerm),
        ilike(orders.totalAmount, searchTerm),
      )!,
    );
  }

  const results = await db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.orderDate));

  return results.map((r) => ({
    ...r,
    labelIds: (r.labelIds as string[]) || [],
    products: (r.products as any[]) || [],
    totalAmount: r.totalAmount || null,
    orderDate: r.orderDate.toISOString(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    createdBy: r.createdBy || null,
    updatedBy: r.updatedBy || null,
    deletedAt: r.deletedAt?.toISOString() || null,
  }));
}

export async function getOrderById(id: string, tenantId: string): Promise<Order | null> {
  const result = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.tenantId, tenantId), isNull(orders.deletedAt)))
    .limit(1);

  if (result.length === 0) return null;

  const r = result[0];
  return {
    ...r,
    labelIds: (r.labelIds as string[]) || [],
    products: (r.products as any[]) || [],
    totalAmount: r.totalAmount || null,
    orderDate: r.orderDate.toISOString(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    createdBy: r.createdBy || null,
    updatedBy: r.updatedBy || null,
    deletedAt: r.deletedAt?.toISOString() || null,
  };
}

export async function createOrder(params: {
  data: CreateOrderInput;
  tenantId: string;
  userId: string;
}): Promise<Order> {
  const { data, tenantId, userId } = params;

  // Validate products and calculate total amount
  let totalAmount = 0;
  for (const product of data.products) {
    // Verify product exists and has sufficient stock
    const productResult = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        quantity: products.quantity,
      })
      .from(products)
      .where(eq(products.id, product.productId))
      .limit(1);

    if (productResult.length === 0) {
      throw new Error(`Product not found: ${product.productId}`);
    }

    const productData = productResult[0];
    const availableQuantity = parseInt(productData.quantity) || 0;
    const requestedQuantity = parseInt(product.quantity) || 0;

    if (requestedQuantity > availableQuantity) {
      throw new Error(
        `Insufficient stock for product ${productData.name}. Available: ${availableQuantity}, Requested: ${requestedQuantity}`,
      );
    }

    // Calculate total
    const price = parseFloat(product.price) || 0;
    totalAmount += price * requestedQuantity;
  }

  // Create order record
  const orderDate = data.orderDate ? new Date(data.orderDate) : new Date();
  const [orderResult] = await db
    .insert(orders)
    .values({
      tenantId,
      userId: data.userId,
      orderDate,
      products: data.products,
      totalAmount: totalAmount.toFixed(2),
      labelIds: data.labelIds || [],
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  // Decrease product quantities
  for (const product of data.products) {
    const requestedQuantity = parseInt(product.quantity) || 0;
    await decreaseProductQuantity(product.productId, tenantId, requestedQuantity, userId);
  }

  return {
    ...orderResult,
    labelIds: (orderResult.labelIds as string[]) || [],
    products: (orderResult.products as any[]) || [],
    totalAmount: orderResult.totalAmount || null,
    orderDate: orderResult.orderDate.toISOString(),
    createdAt: orderResult.createdAt.toISOString(),
    updatedAt: orderResult.updatedAt.toISOString(),
    createdBy: orderResult.createdBy || null,
    updatedBy: orderResult.updatedBy || null,
    deletedAt: orderResult.deletedAt?.toISOString() || null,
  };
}

export async function updateOrder(params: {
  id: string;
  tenantId: string;
  userId: string;
  data: UpdateOrderInput;
}): Promise<Order | null> {
  const { id, tenantId, userId, data } = params;

  const existing = await getOrderById(id, tenantId);
  if (!existing) return null;

  let finalProducts = data.products ?? existing.products;
  let finalOrderDate = data.orderDate ? new Date(data.orderDate) : new Date(existing.orderDate);
  let totalAmount = 0;

  // If products changed, recalculate total
  if (data.products) {
    for (const product of finalProducts) {
      const price = parseFloat(product.price) || 0;
      const quantity = parseInt(product.quantity) || 0;
      totalAmount += price * quantity;
    }
  } else {
    totalAmount = parseFloat(existing.totalAmount || '0') || 0;
  }

  const [orderResult] = await db
    .update(orders)
    .set({
      userId: data.userId ?? existing.userId,
      orderDate: finalOrderDate,
      products: finalProducts,
      totalAmount: totalAmount.toFixed(2),
      labelIds: data.labelIds ?? existing.labelIds,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)))
    .returning();

  return {
    ...orderResult,
    labelIds: (orderResult.labelIds as string[]) || [],
    products: (orderResult.products as any[]) || [],
    totalAmount: orderResult.totalAmount || null,
    orderDate: orderResult.orderDate.toISOString(),
    createdAt: orderResult.createdAt.toISOString(),
    updatedAt: orderResult.updatedAt.toISOString(),
    createdBy: orderResult.createdBy || null,
    updatedBy: orderResult.updatedBy || null,
    deletedAt: orderResult.deletedAt?.toISOString() || null,
  };
}

export async function deleteOrder(id: string, tenantId: string, userId: string): Promise<boolean> {
  const existing = await getOrderById(id, tenantId);
  if (!existing) return false;

  await db
    .update(orders)
    .set({
      deletedAt: new Date(),
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)));

  return true;
}

export async function duplicateOrder(
  id: string,
  tenantId: string,
  userId: string,
): Promise<Order | null> {
  const existing = await getOrderById(id, tenantId);
  if (!existing) return null;

  return createOrder({
    data: {
      userId: existing.userId,
      orderDate: new Date().toISOString(),
      products: existing.products,
      labelIds: existing.labelIds,
    },
    tenantId,
    userId,
  });
}

