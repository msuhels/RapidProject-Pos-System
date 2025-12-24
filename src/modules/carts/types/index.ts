export interface Cart {
  id: string;
  tenantId: string;
  productId: string;
  productName: string | null;
  productPrice: string | null;
  quantity: string;
  userId: string;
  labelIds: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  deletedAt: string | null;
}

export interface CreateCartInput {
  productId: string;
  quantity: string;
  userId: string;
  labelIds?: string[];
}

export interface UpdateCartInput {
  productId?: string;
  quantity?: string;
  userId?: string;
  labelIds?: string[];
}

export interface CartListFilters {
  search?: string;
  userId?: string;
  productId?: string;
}

