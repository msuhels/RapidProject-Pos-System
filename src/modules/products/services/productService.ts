import { and, desc, eq, ilike, isNull, or, ne } from 'drizzle-orm';
import { db } from '@/core/lib/db';
import { products } from '../schemas/productsSchema';
import { isUserSuperAdmin } from '@/core/lib/permissions';
import type { Product, CreateProductInput, UpdateProductInput, ProductListFilters } from '../types';

export async function listProductsForTenant(
  tenantId: string,
  filters: ProductListFilters = {},
  currentUserId?: string,
  showAllProducts?: boolean, // Flag to bypass out-of-stock filter (for inventory module)
): Promise<Product[]> {
  const conditions = [eq(products.tenantId, tenantId), isNull(products.deletedAt)];

  // Check if current user is Super Admin by querying user_roles bridge table
  const isSuperAdmin = currentUserId ? await isUserSuperAdmin(currentUserId) : false;

  // For regular users (non-Super Admin), hide archived products
  // UNLESS showAllProducts flag is true (for inventory management - shows all products including archived)
  if (!isSuperAdmin && !showAllProducts) {
    conditions.push(isNull(products.archivedAt));
  }

  // For regular users (non-Super Admin), hide out of stock products
  // UNLESS showAllProducts flag is true (for inventory management)
  if (!isSuperAdmin && !showAllProducts) {
    conditions.push(ne(products.status, 'out_of_stock'));
  }

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
        ilike(products.discountValue, searchTerm),
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
    discountType: (r.discountType as 'percentage' | 'amount' | null) || null,
    discountValue: r.discountValue || null,
    minimumStockQuantity: r.minimumStockQuantity || null,
    status: r.status || 'in_stock',
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    createdBy: r.createdBy || null,
    updatedBy: r.updatedBy || null,
    deletedAt: r.deletedAt?.toISOString() || null,
    archivedAt: r.archivedAt?.toISOString() || null,
  }));
}

export async function getProductById(
  id: string,
  tenantId: string,
  currentUserId?: string,
  showAllProducts?: boolean, // Flag to bypass out-of-stock filter (for inventory module)
): Promise<Product | null> {
  // Check if current user is Super Admin by querying user_roles bridge table
  const isSuperAdmin = currentUserId ? await isUserSuperAdmin(currentUserId) : false;

  const conditions = [
    eq(products.id, id),
    eq(products.tenantId, tenantId),
    isNull(products.deletedAt),
  ];

  // For regular users (non-Super Admin), hide archived products
  // UNLESS showAllProducts flag is true (for inventory management - shows all products including archived)
  if (!isSuperAdmin && !showAllProducts) {
    conditions.push(isNull(products.archivedAt));
  }

  // For regular users (non-Super Admin), hide out of stock products
  // UNLESS showAllProducts flag is true (for inventory management)
  if (!isSuperAdmin && !showAllProducts) {
    conditions.push(ne(products.status, 'out_of_stock'));
  }

  const result = await db
    .select()
    .from(products)
    .where(and(...conditions))
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
    discountType: (r.discountType as 'percentage' | 'amount' | null) || null,
    discountValue: r.discountValue || null,
    minimumStockQuantity: r.minimumStockQuantity || null,
    status: r.status || 'in_stock',
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    createdBy: r.createdBy || null,
    updatedBy: r.updatedBy || null,
    deletedAt: r.deletedAt?.toISOString() || null,
    archivedAt: r.archivedAt?.toISOString() || null,
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
      discountType: data.discountType || null,
      discountValue: data.discountValue || null,
      quantity: data.quantity,
      minimumStockQuantity: data.minimumStockQuantity || null,
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
    discountType: (result.discountType as 'percentage' | 'amount' | null) || null,
    discountValue: result.discountValue || null,
    minimumStockQuantity: result.minimumStockQuantity || null,
    status: result.status || 'in_stock',
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
    createdBy: result.createdBy || null,
    updatedBy: result.updatedBy || null,
    deletedAt: result.deletedAt?.toISOString() || null,
    archivedAt: result.archivedAt?.toISOString() || null,
  };
}

export async function updateProduct(params: {
  id: string;
  tenantId: string;
  userId: string;
  data: UpdateProductInput;
}): Promise<Product | null> {
  const { id, tenantId, userId, data } = params;

  // Pass userId so admins can update out of stock products
  const existing = await getProductById(id, tenantId, userId);
  if (!existing) return null;

  const [result] = await db
    .update(products)
    .set({
      name: data.name ?? existing.name,
      price: data.price ?? existing.price,
      costPrice: data.costPrice !== undefined ? data.costPrice || null : existing.costPrice,
      sellingPrice: data.sellingPrice !== undefined ? data.sellingPrice || null : existing.sellingPrice,
      taxRate: data.taxRate !== undefined ? data.taxRate || null : existing.taxRate,
      discountType: data.discountType !== undefined ? (data.discountType || null) : existing.discountType,
      discountValue: data.discountValue !== undefined ? data.discountValue || null : existing.discountValue,
      quantity: data.quantity ?? existing.quantity,
      minimumStockQuantity: data.minimumStockQuantity !== undefined ? data.minimumStockQuantity || null : existing.minimumStockQuantity,
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
    discountType: (result.discountType as 'percentage' | 'amount' | null) || null,
    discountValue: result.discountValue || null,
    minimumStockQuantity: result.minimumStockQuantity || null,
    status: result.status || 'in_stock',
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
    createdBy: result.createdBy || null,
    updatedBy: result.updatedBy || null,
    deletedAt: result.deletedAt?.toISOString() || null,
    archivedAt: result.archivedAt?.toISOString() || null,
  };
}

export async function archiveProduct(id: string, tenantId: string, userId: string): Promise<boolean> {
  // Check if product exists (use showAllProducts=true to allow archiving already archived products)
  const existing = await getProductById(id, tenantId, userId, true);
  if (!existing) return false;

  await db
    .update(products)
    .set({
      archivedAt: new Date(),
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(products.id, id), eq(products.tenantId, tenantId), isNull(products.deletedAt)));

  return true;
}

export async function unarchiveProduct(id: string, tenantId: string, userId: string): Promise<boolean> {
  // Check if product exists (use showAllProducts=true to allow unarchiving)
  const existing = await getProductById(id, tenantId, userId, true);
  if (!existing) return false;

  await db
    .update(products)
    .set({
      archivedAt: null,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(products.id, id), eq(products.tenantId, tenantId), isNull(products.deletedAt)));

  return true;
}

export async function deleteProduct(id: string, tenantId: string, userId: string): Promise<boolean> {
  // Pass userId so admins can delete out of stock products
  const existing = await getProductById(id, tenantId, userId);
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
  // Pass userId so admins can duplicate out of stock products
  const existing = await getProductById(id, tenantId, userId);
  if (!existing) return null;

  return createProduct({
    data: {
      name: `${existing.name} (Copy)`,
      price: existing.price,
      costPrice: existing.costPrice || undefined,
      sellingPrice: existing.sellingPrice || undefined,
      taxRate: existing.taxRate || undefined,
      discountType: existing.discountType || undefined,
      discountValue: existing.discountValue || undefined,
      quantity: existing.quantity,
      minimumStockQuantity: existing.minimumStockQuantity || undefined,
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
  reason?: string,
  referenceId?: string,
): Promise<Product | null> {
  // Pass userId so admins can decrease quantity of out of stock products
  const product = await getProductById(productId, tenantId, userId);
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
      status: (() => {
        if (newQuantity === 0) return 'out_of_stock';
        const minStock = parseInt(product.minimumStockQuantity || '10') || 10;
        return newQuantity < minStock ? 'low_stock' : 'in_stock';
      })(),
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
    .returning();

  // Log stock movement
  try {
    const { logStockMovement } = await import('../../inventory/services/stockMovementService');
    await logStockMovement({
      productId,
      tenantId,
      userId,
      movementType: 'decrease',
      quantity: quantityToDecrease,
      previousQuantity: currentQuantity,
      newQuantity,
      reason: reason || 'sale',
      referenceId: referenceId || null,
    });
  } catch (error) {
    console.error('Failed to log stock movement:', error);
    // Don't fail the operation if logging fails
  }

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
    discountType: (result.discountType as 'percentage' | 'amount' | null) || null,
    discountValue: result.discountValue || null,
    minimumStockQuantity: result.minimumStockQuantity || null,
    status: result.status || 'in_stock',
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
    createdBy: result.createdBy || null,
    updatedBy: result.updatedBy || null,
    deletedAt: result.deletedAt?.toISOString() || null,
    archivedAt: result.archivedAt?.toISOString() || null,
  };
}

export async function increaseProductQuantity(
  productId: string,
  tenantId: string,
  quantityToIncrease: number,
  userId: string,
  reason?: string,
  referenceId?: string,
): Promise<Product | null> {
  const product = await getProductById(productId, tenantId, userId, true);
  if (!product) {
    throw new Error('Product not found');
  }

  const currentQuantity = parseInt(product.quantity) || 0;
  const newQuantity = currentQuantity + quantityToIncrease;

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

  // Log stock movement
  try {
    const { logStockMovement } = await import('../../inventory/services/stockMovementService');
    await logStockMovement({
      productId,
      tenantId,
      userId,
      movementType: 'increase',
      quantity: quantityToIncrease,
      previousQuantity: currentQuantity,
      newQuantity,
      reason: reason || 'manual',
      referenceId: referenceId || null,
    });
  } catch (error) {
    console.error('Failed to log stock movement:', error);
    // Don't fail the operation if logging fails
  }

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
    discountType: (result.discountType as 'percentage' | 'amount' | null) || null,
    discountValue: result.discountValue || null,
    minimumStockQuantity: result.minimumStockQuantity || null,
    status: result.status || 'in_stock',
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
    createdBy: result.createdBy || null,
    updatedBy: result.updatedBy || null,
    deletedAt: result.deletedAt?.toISOString() || null,
    archivedAt: result.archivedAt?.toISOString() || null,
  };
}

