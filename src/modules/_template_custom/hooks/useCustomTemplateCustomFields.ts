// Minimal hook showing how a custom-fields module would expose custom fields.
// This reference implementation intentionally does NOT fetch from the API or database.
// Real modules should copy the Students module hook to implement full behaviour.

import type { CustomFieldDefinition } from '@/core/store/customFieldsStore';

export function useCustomTemplateCustomFields() {
  const customFields: CustomFieldDefinition[] = [];
  return { customFields, loading: false };
}


