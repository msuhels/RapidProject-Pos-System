// REFERENCE TYPES for a custom-fields-enabled module.
// Real modules should replace these with module-specific shapes.

export type CustomTemplateStatus = 'active' | 'inactive' | 'archived';

export interface CustomTemplateRecord {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  status: CustomTemplateStatus;
  // Custom fields are stored in a JSON-like object keyed by field code
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomTemplateInput {
  name: string;
  description?: string;
  status?: CustomTemplateStatus;
  customFields?: Record<string, unknown>;
}

export interface UpdateCustomTemplateInput {
  name?: string;
  description?: string;
  status?: CustomTemplateStatus;
  customFields?: Record<string, unknown>;
}


