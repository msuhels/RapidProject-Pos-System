export interface OrderProduct {
  productId: string;
  quantity: string;
  price: string;
  productName?: string;
}

export interface Order {
  id: string;
  tenantId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  orderDate: string;
  products: OrderProduct[];
  totalAmount: string | null;
  labelIds: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  deletedAt: string | null;
}

export interface CreateOrderInput {
  userId: string;
  orderDate?: string;
  products: OrderProduct[];
  labelIds?: string[];
}

export interface UpdateOrderInput {
  userId?: string;
  orderDate?: string;
  products?: OrderProduct[];
  labelIds?: string[];
}

export interface OrderListFilters {
  search?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

