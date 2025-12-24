// Inventory module uses Product type directly
export type { Product } from '../../products/types';

export interface InventoryListFilters {
  search?: string;
  status?: string;
  location?: string;
  productId?: string;
}

export interface UpdateInventoryInput {
  sku?: string;
  location?: string;
  quantity?: string;
  status?: string;
}
