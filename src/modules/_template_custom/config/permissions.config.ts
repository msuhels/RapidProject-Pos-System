// Permission definitions for the custom-fields-enabled template module.
// Real modules should copy this file and replace the `template_custom` prefix.

export interface CustomTemplatePermissionDefinition {
  code: string;
  name: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'manage';
  description: string;
  isDangerous?: boolean;
  requiresMfa?: boolean;
}

export const CUSTOM_TEMPLATE_PERMISSIONS: CustomTemplatePermissionDefinition[] = [
  {
    code: 'template_custom:create',
    name: 'Create Custom Template Records',
    action: 'create',
    description: 'Create new records in this module',
  },
  {
    code: 'template_custom:read',
    name: 'Read Custom Template Records',
    action: 'read',
    description: 'View and read records in this module',
  },
  {
    code: 'template_custom:update',
    name: 'Update Custom Template Records',
    action: 'update',
    description: 'Edit and update existing records in this module',
  },
  {
    code: 'template_custom:delete',
    name: 'Delete Custom Template Records',
    action: 'delete',
    description: 'Delete records in this module',
    isDangerous: true,
  },
  {
    code: 'template_custom:export',
    name: 'Export Custom Template Records',
    action: 'export',
    description: 'Export records to CSV files',
  },
  {
    code: 'template_custom:*',
    name: 'Full Custom Template Management',
    action: 'manage',
    description: 'Full access to all operations in this module',
  },
];


