import { and, desc, eq, ilike, isNull, or } from 'drizzle-orm';
import { db } from '@/core/lib/db';
import { carts } from '../schemas/cartsSchema';
import { products } from '../../products/schemas/productsSchema';
import type { Cart, CreateCartInput, UpdateCartInput, CartListFilters } from '../types';

export async function listCartsForTenant(
  tenantId: string,
  filters: CartListFilters = {},
): Promise<Cart[]> {
  const conditions = [eq(carts.tenantId, tenantId), isNull(carts.deletedAt)];

  if (filters.userId) {
    conditions.push(eq(carts.userId, filters.userId));
  }

  if (filters.productId) {
    conditions.push(eq(carts.productId, filters.productId));
  }

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(carts.quantity, searchTerm),
        ilike(carts.productId, searchTerm),
        ilike(carts.userId, searchTerm),
        ilike(carts.productName, searchTerm),
        ilike(carts.productPrice, searchTerm),
      )!,
    );
  }

  const results = await db
    .select()
    .from(carts)
    .where(and(...conditions))
    .orderBy(desc(carts.createdAt));

  return results.map((r) => ({
    ...r,
    labelIds: (r.labelIds as string[]) || [],
    productName: r.productName || null,
    productPrice: r.productPrice || null,
    createdBy: r.createdBy || null,
    updatedBy: r.updatedBy || null,
    deletedAt: r.deletedAt || null,
  }));
}

export async function getCartById(id: string, tenantId: string): Promise<Cart | null> {
  const result = await db
    .select()
    .from(carts)
    .where(and(eq(carts.id, id), eq(carts.tenantId, tenantId), isNull(carts.deletedAt)))
    .limit(1);

  if (result.length === 0) return null;

  const r = result[0];
  return {
    ...r,
    labelIds: (r.labelIds as string[]) || [],
    productName: r.productName || null,
    productPrice: r.productPrice || null,
    createdBy: r.createdBy || null,
    updatedBy: r.updatedBy || null,
    deletedAt: r.deletedAt || null,
  };
}

export async function createCart(params: {
  data: CreateCartInput;
  tenantId: string;
  userId: string;
}): Promise<Cart> {
  const { data, tenantId, userId } = params;

  // Fetch product details to store name and price
  const productResult = await db
    .select({
      name: products.name,
      price: products.price,
    })
    .from(products)
    .where(eq(products.id, data.productId))
    .limit(1);

  const productName = productResult.length > 0 ? productResult[0].name : null;
  const productPrice = productResult.length > 0 ? productResult[0].price : null;

  const [cartResult] = await db
    .insert(carts)
    .values({
      tenantId,
      productId: data.productId,
      productName,
      productPrice,
      quantity: data.quantity,
      userId: data.userId,
      labelIds: data.labelIds || [],
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return {
    ...cartResult,
    labelIds: (cartResult.labelIds as string[]) || [],
    productName: cartResult.productName || null,
    productPrice: cartResult.productPrice || null,
    createdBy: cartResult.createdBy || null,
    updatedBy: cartResult.updatedBy || null,
    deletedAt: cartResult.deletedAt || null,
  };
}

export async function updateCart(params: {
  id: string;
  tenantId: string;
  userId: string;
  data: UpdateCartInput;
}): Promise<Cart | null> {
  const { id, tenantId, userId, data } = params;

  const existing = await getCartById(id, tenantId);
  if (!existing) return null;

  const finalProductId = data.productId ?? existing.productId;

  // Fetch product details if productId changed
  let productName = existing.productName;
  let productPrice = existing.productPrice;
  
  if (data.productId && data.productId !== existing.productId) {
    const productResult = await db
      .select({
        name: products.name,
        price: products.price,
      })
      .from(products)
      .where(eq(products.id, finalProductId))
      .limit(1);

    if (productResult.length > 0) {
      productName = productResult[0].name;
      productPrice = productResult[0].price;
    }
  }

  const [cartResult] = await db
    .update(carts)
    .set({
      productId: finalProductId,
      productName,
      productPrice,
      quantity: data.quantity ?? existing.quantity,
      userId: data.userId ?? existing.userId,
      labelIds: data.labelIds ?? existing.labelIds,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(carts.id, id), eq(carts.tenantId, tenantId)))
    .returning();

  return {
    ...cartResult,
    labelIds: (cartResult.labelIds as string[]) || [],
    productName: cartResult.productName || null,
    productPrice: cartResult.productPrice || null,
    createdBy: cartResult.createdBy || null,
    updatedBy: cartResult.updatedBy || null,
    deletedAt: cartResult.deletedAt || null,
  };
}

export async function deleteCart(id: string, tenantId: string, userId: string): Promise<boolean> {
  const existing = await getCartById(id, tenantId);
  if (!existing) return false;

  await db
    .update(carts)
    .set({
      deletedAt: new Date(),
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(carts.id, id), eq(carts.tenantId, tenantId)));

  return true;
}

export async function duplicateCart(
  id: string,
  tenantId: string,
  userId: string,
): Promise<Cart | null> {
  const existing = await getCartById(id, tenantId);
  if (!existing) return null;

  return createCart({
    data: {
      productId: existing.productId,
      quantity: existing.quantity,
      userId: existing.userId,
      labelIds: existing.labelIds,
    },
    tenantId,
    userId,
  });
}

