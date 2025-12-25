export interface StockAdjustment {
  id: string;
  tenantId: string;
  productId: string;
  productName?: string;
  adjustmentType: 'increase' | 'decrease';
  quantity: string;
  previousQuantity: string;
  newQuantity: string;
  reason: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  deletedAt: string | null;
}

export interface CreateStockAdjustmentInput {
  productId: string;
  adjustmentType: 'increase' | 'decrease';
  quantity: number;
  reason: string;
  notes?: string;
}

export interface UpdateStockAdjustmentInput {
  reason?: string;
  notes?: string;
}

export interface StockAdjustmentListFilters {
  search?: string;
  productId?: string;
  adjustmentType?: 'increase' | 'decrease';
  reason?: string;
  dateFrom?: string;
  dateTo?: string;
}
