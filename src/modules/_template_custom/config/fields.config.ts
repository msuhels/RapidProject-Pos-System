// System field definitions for the custom-fields-enabled template module.
// Real modules should copy this file and adjust field list, codes, labels, and types.

export interface CustomTemplateFieldDefinition {
  name: string;
  code: string;
  label: string;
  fieldType: 'text' | 'textarea' | 'select';
  description?: string;
  sortOrder: number;
}

export const CUSTOM_TEMPLATE_FIELDS: CustomTemplateFieldDefinition[] = [
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


