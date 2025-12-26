export interface Product {
  id: string;
  tenantId: string;
  name: string;
  price: string;
  costPrice: string | null;
  sellingPrice: string | null;
  taxRate: string | null;
  quantity: string;
  minimumStockQuantity: string | null;
  supplierId: string | null;
  supplierName?: string | null;
  image: string | null;
  category: string | null;
  sku: string | null;
  location: string | null;
  status: string;
  discountType: 'percentage' | 'amount' | null;
  discountValue: string | null;
  labelIds: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  deletedAt: string | null;
  archivedAt: string | null;
}

export interface CreateProductInput {
  name: string;
  price: string;
  costPrice?: string;
  sellingPrice?: string;
  taxRate?: string;
  discountType?: 'percentage' | 'amount';
  discountValue?: string;
  quantity: string;
  minimumStockQuantity: string;
  supplierId?: string;
  image?: string;
  category?: string;
  sku?: string;
  location?: string;
  labelIds?: string[];
}

export interface UpdateProductInput {
  name?: string;
  price?: string;
  costPrice?: string;
  sellingPrice?: string;
  taxRate?: string;
  discountType?: 'percentage' | 'amount';
  discountValue?: string;
  quantity?: string;
  minimumStockQuantity?: string;
  supplierId?: string;
  image?: string;
  category?: string;
  sku?: string;
  location?: string;
  labelIds?: string[];
}

export interface ProductListFilters {
  search?: string;
  category?: string;
  status?: string;
  location?: string;
}

