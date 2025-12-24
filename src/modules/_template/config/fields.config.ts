/**
 * Template Module Field Definitions
 *
 * Copy this file when creating a new module and:
 * 1. Rename the exported constant
 * 2. Update field definitions (name, code, label, fieldType)
 * 3. Adjust sortOrder values
 */

export interface TemplateModuleFieldDefinition {
  name: string;
  code: string;
  label: string;
  fieldType: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean' | 'json';
  description?: string;
  sortOrder: number;
}

// Example fields - replace with your module-specific fields
export const TEMPLATE_FIELDS: TemplateModuleFieldDefinition[] = [
  {
    name: 'Name',
    code: 'name',
    label: 'Name',
    fieldType: 'text',
    description: 'Primary name field for this module',
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
];


