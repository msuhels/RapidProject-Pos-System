// Service layer for the custom-fields-enabled template module.
// This service uses an in-memory array as a stand-in for real persistence.
// Real modules should replace this logic with database access and custom-field search.

import type {
  CustomTemplateRecord,
  CreateCustomTemplateInput,
  UpdateCustomTemplateInput,
} from '../types';

export interface CustomTemplateListFilters {
  search?: string;
  status?: string;
}

const store: CustomTemplateRecord[] = [];

export async function listCustomTemplates(
  _tenantId: string,
  filters: CustomTemplateListFilters = {},
): Promise<CustomTemplateRecord[]> {
  const { search, status } = filters;

  let results = [...store];

  if (status && status !== 'all') {
    results = results.filter((item) => item.status === status);
  }

  if (search) {
    const term = search.toLowerCase();
    results = results.filter((item) => {
      const systemMatch =
        item.name.toLowerCase().includes(term) ||
        (item.description ?? '').toLowerCase().includes(term);

      if (systemMatch) return true;

      // Example: search across custom field values as strings
      return Object.values(item.customFields ?? {}).some((value) =>
        String(value ?? '').toLowerCase().includes(term),
      );
    });
  }

  return results;
}

export async function getCustomTemplateById(
  id: string,
  _tenantId: string,
): Promise<CustomTemplateRecord | null> {
  const item = store.find((record) => record.id === id);
  return item ?? null;
}

export async function createCustomTemplate(params: {
  data: CreateCustomTemplateInput;
  tenantId: string;
  userId: string;
}): Promise<CustomTemplateRecord> {
  const { data, tenantId } = params;

  const now = new Date().toISOString();
  const record: CustomTemplateRecord = {
    id: `custom-${Date.now()}`,
    tenantId,
    name: data.name,
    description: data.description ?? null,
    status: data.status ?? 'active',
    customFields: data.customFields ?? {},
    createdAt: now,
    updatedAt: now,
  };

  store.push(record);
  return record;
}

export async function updateCustomTemplate(params: {
  id: string;
  tenantId: string;
  userId: string;
  data: UpdateCustomTemplateInput;
}): Promise<CustomTemplateRecord | null> {
  const { id, data } = params;

  const index = store.findIndex((record) => record.id === id);
  if (index === -1) return null;

  const existing = store[index];
  const updated: CustomTemplateRecord = {
    ...existing,
    name: data.name ?? existing.name,
    description: data.description ?? existing.description,
    status: data.status ?? existing.status,
    customFields: data.customFields ?? existing.customFields,
    updatedAt: new Date().toISOString(),
  };

  store[index] = updated;
  return updated;
}

export async function deleteCustomTemplate(
  id: string,
  _tenantId: string,
  _userId: string,
): Promise<boolean> {
  const index = store.findIndex((record) => record.id === id);
  if (index === -1) return false;

  store.splice(index, 1);
  return true;
}


