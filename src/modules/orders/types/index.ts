export interface OrderProduct {
  productId: string;
  quantity: string;
  price: string;
  productName?: string;
  taxRate?: string;
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
  subtotalAmount: string | null;
  taxAmount: string | null;
  discountAmount: string | null;
  discountType: string | null;
  labelIds: string[];
  isVoided: boolean;
  voidedBy: string | null;
  voidedAt: string | null;
  voidReason: string | null;
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
  discountAmount?: number;
  discountType?: 'percentage' | 'fixed';
}

export interface UpdateOrderInput {
  userId?: string;
  orderDate?: string;
  products?: OrderProduct[];
  labelIds?: string[];
  discountAmount?: number;
  discountType?: 'percentage' | 'fixed';
}

export interface OrderListFilters {
  search?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

