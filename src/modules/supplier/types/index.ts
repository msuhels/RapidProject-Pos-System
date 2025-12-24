import type { CreateSupplierInput, UpdateSupplierInput } from '../schemas/supplierValidation';

export interface SupplierRecord {
  id: string;
  tenantId: string;
  supplierCode: string;
  supplierName: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status: 'active' | 'inactive';
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export type { CreateSupplierInput, UpdateSupplierInput };

export interface SupplierListFilters {
  search?: string;
  status?: 'active' | 'inactive';
}

