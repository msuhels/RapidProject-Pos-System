import { and, desc, eq, ilike, isNull, or, ne } from 'drizzle-orm';
import { db } from '@/core/lib/db';
import { products } from '../schemas/productsSchema';
import { suppliers } from '@/modules/supplier/schemas/supplierSchema';
import { isUserSuperAdmin } from '@/core/lib/permissions';
import type { Product, CreateProductInput, UpdateProductInput, ProductListFilters } from '../types';

// Helper function to calculate product status based on quantity and minimum stock quantity
function calculateProductStatus(quantity: string, minimumStockQuantity: string | null): string {
  const qty = parseInt(quantity) || 0;
  const minQty = parseInt(minimumStockQuantity || '0') || 0;
  
  if (qty === 0) {
    return 'out_of_stock';
  }
  
  if (minQty > 0 && qty <= minQty) {
    return 'low_stock';
  }
  
  return 'in_stock';
}

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
    .select({
      product: products,
      supplier: suppliers,
    })
    .from(products)
    .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
    .where(and(...conditions))
    .orderBy(desc(products.createdAt));

  return results.map(({ product: r, supplier }) => ({
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
    supplierId: r.supplierId || null,
    supplierName: supplier?.supplierName || null,
    status: calculateProductStatus(r.quantity, r.minimumStockQuantity),
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
    .select({
      product: products,
      supplier: suppliers,
    })
    .from(products)
    .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
    .where(and(...conditions))
    .limit(1);

  if (result.length === 0) return null;

  const { product: r, supplier } = result[0];
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
    supplierId: r.supplierId || null,
    supplierName: supplier?.supplierName || null,
    status: calculateProductStatus(r.quantity, r.minimumStockQuantity),
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

  // Calculate status based on quantity and minimum stock quantity
  const calculatedStatus = calculateProductStatus(data.quantity, data.minimumStockQuantity);

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
      supplierId: data.supplierId || null,
      image: data.image || null,
      category: data.category || null,
      sku: data.sku || null,
      location: data.location || null,
      status: calculatedStatus,
      labelIds: data.labelIds || [],
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  // Fetch supplier name if supplierId exists
  let supplierName = null;
  if (result.supplierId) {
    const supplier = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, result.supplierId))
      .limit(1);
    supplierName = supplier[0]?.supplierName || null;
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
    supplierId: result.supplierId || null,
    supplierName,
    status: calculatedStatus,
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

  // Calculate new quantity and minimum stock quantity
  const newQuantity = data.quantity ?? existing.quantity;
  const newMinimumStockQuantity = data.minimumStockQuantity !== undefined 
    ? (data.minimumStockQuantity || null) 
    : existing.minimumStockQuantity;
  
  // Calculate status based on updated quantity and MSQ
  const calculatedStatus = calculateProductStatus(newQuantity, newMinimumStockQuantity);

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
      quantity: newQuantity,
      minimumStockQuantity: newMinimumStockQuantity,
      supplierId: data.supplierId !== undefined ? (data.supplierId || null) : existing.supplierId,
      image: data.image !== undefined ? data.image || null : existing.image,
      category: data.category !== undefined ? data.category || null : existing.category,
      sku: data.sku !== undefined ? data.sku || null : existing.sku,
      location: data.location !== undefined ? data.location || null : existing.location,
      status: calculatedStatus,
      labelIds: data.labelIds ?? existing.labelIds,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
    .returning();

  // Fetch supplier name if supplierId exists
  let supplierName = null;
  if (result.supplierId) {
    const supplier = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, result.supplierId))
      .limit(1);
    supplierName = supplier[0]?.supplierName || null;
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
    supplierId: result.supplierId || null,
    supplierName,
    status: calculatedStatus,
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
      minimumStockQuantity: existing.minimumStockQuantity || '',
      supplierId: existing.supplierId || undefined,
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
      status: calculateProductStatus(newQuantity.toString(), product.minimumStockQuantity),
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
      status: calculateProductStatus(newQuantity.toString(), product.minimumStockQuantity),
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

