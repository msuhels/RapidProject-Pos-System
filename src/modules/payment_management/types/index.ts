export type PaymentStatus = 'paid' | 'partial' | 'refunded';

export interface PaymentMethod {
  id: string;
  tenantId: string;
  name: string;
  isActive: boolean;
  supportsRefund: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  saleReference: string;
  paymentMethodId: string;
  amount: number;
  paymentStatus: PaymentStatus;
  transactionReference?: string | null;
  paymentDate: string;
  notes?: string | null;
  isReversed: boolean;
  reversedBy?: string | null;
  reversedAt?: string | null;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  // Joined data
  paymentMethod?: PaymentMethod;
}

export interface CreatePaymentInput {
  saleReference: string;
  paymentMethodId: string;
  amount: number;
  paymentStatus?: PaymentStatus;
  transactionReference?: string | null;
  paymentDate?: string;
  notes?: string | null;
  customFields?: Record<string, unknown>;
}

export interface UpdatePaymentInput {
  paymentStatus?: PaymentStatus;
  amount?: number;
  transactionReference?: string | null;
  paymentDate?: string;
  notes?: string | null;
  customFields?: Record<string, unknown>;
}

export interface CreatePaymentMethodInput {
  name: string;
  isActive?: boolean;
  supportsRefund?: boolean;
}

export interface UpdatePaymentMethodInput {
  name?: string;
  isActive?: boolean;
  supportsRefund?: boolean;
}

export interface PaymentListFilters {
  search?: string;
  paymentStatus?: PaymentStatus;
  paymentMethodId?: string;
  dateFrom?: string;
  dateTo?: string;
}


