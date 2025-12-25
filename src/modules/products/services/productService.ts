import { and, desc, eq, ilike, isNull, or } from 'drizzle-orm';
import { db } from '@/core/lib/db';
import { products } from '../schemas/productsSchema';
import type { Product, CreateProductInput, UpdateProductInput, ProductListFilters } from '../types';

export async function listProductsForTenant(
  tenantId: string,
  filters: ProductListFilters = {},
): Promise<Product[]> {
  const conditions = [eq(products.tenantId, tenantId), isNull(products.deletedAt)];

  if (filters.category && filters.category !== 'all') {
    conditions.push(eq(products.category, filters.category));
  }

  if (filters.status && filters.status !== 'all') {
    conditions.push(eq(products.status, filters.status));
  }

  if (filters.location && filters.location !== 'all') {
    conditions.push(eq(products.location, filters.location));
  }

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(products.name, searchTerm),
        ilike(products.price, searchTerm),
        ilike(products.costPrice, searchTerm),
        ilike(products.sellingPrice, searchTerm),
        ilike(products.taxRate, searchTerm),
        ilike(products.quantity, searchTerm),
        ilike(products.category, searchTerm),
        ilike(products.sku, searchTerm),
        ilike(products.location, searchTerm),
      )!,
    );
  }

  const results = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.createdAt));

  return results.map((r) => ({
    ...r,
    labelIds: (r.labelIds as string[]) || [],
    image: r.image || null,
    category: r.category || null,
    sku: r.sku || null,
    location: r.location || null,
    costPrice: r.costPrice || null,
    sellingPrice: r.sellingPrice || null,
    taxRate: r.taxRate || null,
    status: r.status || 'in_stock',
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    createdBy: r.createdBy || null,
    updatedBy: r.updatedBy || null,
    deletedAt: r.deletedAt?.toISOString() || null,
  }));
}

export async function getProductById(id: string, tenantId: string): Promise<Product | null> {
  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.tenantId, tenantId), isNull(products.deletedAt)))
    .limit(1);

  if (result.length === 0) return null;

  const r = result[0];
  return {
    ...r,
    labelIds: (r.labelIds as string[]) || [],
    image: r.image || null,
    category: r.category || null,
    sku: r.sku || null,
    location: r.location || null,
    costPrice: r.costPrice || null,
    sellingPrice: r.sellingPrice || null,
    taxRate: r.taxRate || null,
    status: r.status || 'in_stock',
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    createdBy: r.createdBy || null,
    updatedBy: r.updatedBy || null,
    deletedAt: r.deletedAt?.toISOString() || null,
  };
}

export async function createProduct(params: {
  data: CreateProductInput;
  tenantId: string;
  userId: string;
}): Promise<Product> {
  const { data, tenantId, userId } = params;

  const [result] = await db
    .insert(products)
    .values({
      tenantId,
      name: data.name,
      price: data.price,
      costPrice: data.costPrice || null,
      sellingPrice: data.sellingPrice || null,
      taxRate: data.taxRate || null,
      quantity: data.quantity,
      image: data.image || null,
      category: data.category || null,
      sku: data.sku || null,
      location: data.location || null,
      status: data.status || 'in_stock',
      labelIds: data.labelIds || [],
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return {
    ...result,
    labelIds: (result.labelIds as string[]) || [],
    image: result.image || null,
    category: result.category || null,
    sku: result.sku || null,
    location: result.location || null,
    costPrice: result.costPrice || null,
    sellingPrice: result.sellingPrice || null,
    taxRate: result.taxRate || null,
    status: result.status || 'in_stock',
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
    createdBy: result.createdBy || null,
    updatedBy: result.updatedBy || null,
    deletedAt: result.deletedAt?.toISOString() || null,
  };
}

export async function updateProduct(params: {
  id: string;
  tenantId: string;
  userId: string;
  data: UpdateProductInput;
}): Promise<Product | null> {
  const { id, tenantId, userId, data } = params;

  const existing = await getProductById(id, tenantId);
  if (!existing) return null;

  const [result] = await db
    .update(products)
    .set({
      name: data.name ?? existing.name,
      price: data.price ?? existing.price,
      costPrice: data.costPrice !== undefined ? data.costPrice || null : existing.costPrice,
      sellingPrice: data.sellingPrice !== undefined ? data.sellingPrice || null : existing.sellingPrice,
      taxRate: data.taxRate !== undefined ? data.taxRate || null : existing.taxRate,
      quantity: data.quantity ?? existing.quantity,
      image: data.image !== undefined ? data.image || null : existing.image,
      category: data.category !== undefined ? data.category || null : existing.category,
      sku: data.sku !== undefined ? data.sku || null : existing.sku,
      location: data.location !== undefined ? data.location || null : existing.location,
      status: data.status ?? existing.status,
      labelIds: data.labelIds ?? existing.labelIds,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
    .returning();

  return {
    ...result,
    labelIds: (result.labelIds as string[]) || [],
    image: result.image || null,
    category: result.category || null,
    sku: result.sku || null,
    location: result.location || null,
    costPrice: result.costPrice || null,
    sellingPrice: result.sellingPrice || null,
    taxRate: result.taxRate || null,
    status: result.status || 'in_stock',
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
    createdBy: result.createdBy || null,
    updatedBy: result.updatedBy || null,
    deletedAt: result.deletedAt?.toISOString() || null,
  };
}

export async function deleteProduct(id: string, tenantId: string, userId: string): Promise<boolean> {
  const existing = await getProductById(id, tenantId);
  if (!existing) return false;

  await db
    .update(products)
    .set({
      deletedAt: new Date(),
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(products.id, id), eq(products.tenantId, tenantId)));

  return true;
}

export async function duplicateProduct(
  id: string,
  tenantId: string,
  userId: string,
): Promise<Product | null> {
  const existing = await getProductById(id, tenantId);
  if (!existing) return null;

  return createProduct({
    data: {
      name: `${existing.name} (Copy)`,
      price: existing.price,
      costPrice: existing.costPrice || undefined,
      sellingPrice: existing.sellingPrice || undefined,
      taxRate: existing.taxRate || undefined,
      quantity: existing.quantity,
      image: existing.image || undefined,
      category: existing.category || undefined,
      labelIds: existing.labelIds,
    },
    tenantId,
    userId,
  });
}

export async function decreaseProductQuantity(
  productId: string,
  tenantId: string,
  quantityToDecrease: number,
  userId: string,
): Promise<Product | null> {
  const product = await getProductById(productId, tenantId);
  if (!product) {
    throw new Error('Product not found');
  }

  const currentQuantity = parseInt(product.quantity) || 0;
  const newQuantity = Math.max(0, currentQuantity - quantityToDecrease);

  if (newQuantity < 0) {
    throw new Error(`Insufficient stock. Available: ${currentQuantity}, Requested: ${quantityToDecrease}`);
  }

  const [result] = await db
    .update(products)
    .set({
      quantity: newQuantity.toString(),
      status: newQuantity === 0 ? 'out_of_stock' : newQuantity < 10 ? 'low_stock' : 'in_stock',
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
    .returning();

  return {
    ...result,
    labelIds: (result.labelIds as string[]) || [],
    image: result.image || null,
    category: result.category || null,
    sku: result.sku || null,
    location: result.location || null,
    costPrice: result.costPrice || null,
    sellingPrice: result.sellingPrice || null,
    taxRate: result.taxRate || null,
    status: result.status || 'in_stock',
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
    createdBy: result.createdBy || null,
    updatedBy: result.updatedBy || null,
    deletedAt: result.deletedAt?.toISOString() || null,
  };
}

