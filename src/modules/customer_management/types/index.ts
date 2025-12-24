export interface CustomerRecord {
  id: string;
  tenantId: string;
  name: string;
  phoneNumber?: string | null;
  email?: string | null;
  totalPurchases: number;
  outstandingBalance: number;
  isActive: boolean;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface CreateCustomerInput {
  name: string;
  phoneNumber?: string;
  email?: string;
  totalPurchases?: number;
  outstandingBalance?: number;
  isActive?: boolean;
  customFields?: Record<string, unknown>;
}

export interface UpdateCustomerInput {
  name?: string;
  phoneNumber?: string;
  email?: string;
  totalPurchases?: number;
  outstandingBalance?: number;
  isActive?: boolean;
  customFields?: Record<string, unknown>;
}

export interface CustomerListFilters {
  search?: string;
  isActive?: boolean;
  hasOutstandingBalance?: boolean;
}

