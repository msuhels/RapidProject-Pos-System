// System field definitions for the static (non-custom-fields) template module.
// Real modules should copy this file and adjust field list, codes, labels, and types.

export interface StaticTemplateFieldDefinition {
  name: string;
  code: string;
  label: string;
  fieldType: 'text' | 'textarea' | 'select';
  description?: string;
  sortOrder: number;
}

export const STATIC_TEMPLATE_FIELDS: StaticTemplateFieldDefinition[] = [
  {
    name: 'Name',
    code: 'name',
    label: 'Name',
    fieldType: 'text',
    description: 'Primary name field for this record',
    sortOrder: 1,
  },
  {
    name: 'Description',
    code: 'description',
    label: 'Description',
    fieldType: 'textarea',
    description: 'Description or notes for this record',
    sortOrder: 2,
  },
  {
    name: 'Status',
    code: 'status',
    label: 'Status',
    fieldType: 'select',
    description: 'Record status',
    sortOrder: 3,
  },
];


