// Service layer for the static (non-custom-fields) template module.
// This service uses an in-memory array as a stand-in for real persistence.
// Real modules should replace this logic with database access.

import type {
  StaticTemplateRecord,
  CreateStaticTemplateInput,
  UpdateStaticTemplateInput,
} from '../types';

export interface StaticTemplateListFilters {
  search?: string;
  status?: string;
}

// In-memory store (reference only, not used in production)
const store: StaticTemplateRecord[] = [];

export async function listStaticTemplates(
  _tenantId: string,
  filters: StaticTemplateListFilters = {},
): Promise<StaticTemplateRecord[]> {
  const { search, status } = filters;

  let results = [...store];

  if (status && status !== 'all') {
    results = results.filter((item) => item.status === status);
  }

  if (search) {
    const term = search.toLowerCase();
    results = results.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        (item.description ?? '').toLowerCase().includes(term),
    );
  }

  return results;
}

export async function getStaticTemplateById(
  id: string,
  _tenantId: string,
): Promise<StaticTemplateRecord | null> {
  const item = store.find((record) => record.id === id);
  return item ?? null;
}

export async function createStaticTemplate(params: {
  data: CreateStaticTemplateInput;
  tenantId: string;
  userId: string;
}): Promise<StaticTemplateRecord> {
  const { data, tenantId } = params;

  const now = new Date().toISOString();
  const record: StaticTemplateRecord = {
    id: `static-${Date.now()}`,
    tenantId,
    name: data.name,
    description: data.description ?? null,
    status: data.status ?? 'active',
    createdAt: now,
    updatedAt: now,
  };

  store.push(record);
  return record;
}

export async function updateStaticTemplate(params: {
  id: string;
  tenantId: string;
  userId: string;
  data: UpdateStaticTemplateInput;
}): Promise<StaticTemplateRecord | null> {
  const { id, data } = params;

  const index = store.findIndex((record) => record.id === id);
  if (index === -1) return null;

  const existing = store[index];
  const updated: StaticTemplateRecord = {
    ...existing,
    name: data.name ?? existing.name,
    description: data.description ?? existing.description,
    status: data.status ?? existing.status,
    updatedAt: new Date().toISOString(),
  };

  store[index] = updated;
  return updated;
}

export async function deleteStaticTemplate(
  id: string,
  _tenantId: string,
  _userId: string,
): Promise<boolean> {
  const index = store.findIndex((record) => record.id === id);
  if (index === -1) return false;

  store.splice(index, 1);
  return true;
}


