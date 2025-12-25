import { listProductsForTenant, updateProduct, getProductById } from '../../products/services/productService';
import type { Product, ProductListFilters } from '../../products/types';
import type { InventoryListFilters } from '../types';

// Inventory module now works directly with products
export async function listInventoryForTenant(
  tenantId: string,
  filters: InventoryListFilters = {},
): Promise<Product[]> {
  const productFilters: ProductListFilters = {
    search: filters.search,
    status: filters.status,
    location: filters.location,
    category: filters.productId ? undefined : undefined, // We can filter by category if needed
  };

  // Inventory module should show ALL products including out of stock
  // Pass showAllProducts=true to bypass the out-of-stock filter
  return listProductsForTenant(tenantId, productFilters, undefined, true);
}

export async function getInventoryById(
  id: string,
  tenantId: string,
  currentUserId?: string,
): Promise<Product | null> {
  // Inventory module should show ALL products including out of stock
  // Pass showAllProducts=true to bypass the out-of-stock filter
  return getProductById(id, tenantId, currentUserId, true);
}

export async function updateInventoryItem(params: {
  id: string;
  tenantId: string;
  userId: string;
  data: {
    sku?: string;
    location?: string;
    quantity?: string;
    status?: string;
  };
}): Promise<Product | null> {
  const { id, tenantId, userId, data } = params;

  // Inventory module should show ALL products including out of stock
  // Pass showAllProducts=true to bypass the out-of-stock filter
  const existing = await getProductById(id, tenantId, userId, true);
  if (!existing) return null;

  return updateProduct({
    id,
    tenantId,
    userId,
    data: {
      sku: data.sku !== undefined ? data.sku : existing.sku,
      location: data.location !== undefined ? data.location : existing.location,
      quantity: data.quantity !== undefined ? data.quantity : existing.quantity,
      status: data.status !== undefined ? data.status : existing.status,
    },
  });
}
