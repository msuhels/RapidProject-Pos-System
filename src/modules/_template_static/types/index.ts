// REFERENCE TYPES for a non-custom-fields module.
// Real modules should replace these with module-specific shapes.

export type StaticTemplateStatus = 'active' | 'inactive' | 'archived';

export interface StaticTemplateRecord {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  status: StaticTemplateStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaticTemplateInput {
  name: string;
  description?: string;
  status?: StaticTemplateStatus;
}

export interface UpdateStaticTemplateInput {
  name?: string;
  description?: string;
  status?: StaticTemplateStatus;
}


