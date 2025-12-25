export type ReportType =
  | 'daily_sales'
  | 'weekly_sales'
  | 'monthly_sales'
  | 'product_wise'
  | 'user_wise'
  | 'payment_method_wise'
  | 'low_stock';

export interface ReportRecord {
  productId?: string;
  userId?: string;
  quantity: number;
  price: number;
  date: string;
  productName?: string;
  userName?: string;
  paymentMethod?: string;
  totalAmount?: number;
  orderCount?: number;
}

export interface ReportListFilters {
  reportType?: ReportType;
  dateFrom?: string;
  dateTo?: string;
  productId?: string;
  userId?: string;
  paymentMethod?: string;
}

