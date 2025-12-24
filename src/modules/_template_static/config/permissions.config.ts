// Permission definitions for the static (non-custom-fields) template module.
// Real modules should copy this file and replace the `template_static` prefix.

export interface StaticTemplatePermissionDefinition {
  code: string;
  name: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'manage';
  description: string;
  isDangerous?: boolean;
  requiresMfa?: boolean;
}

export const STATIC_TEMPLATE_PERMISSIONS: StaticTemplatePermissionDefinition[] = [
  {
    code: 'template_static:create',
    name: 'Create Static Template Records',
    action: 'create',
    description: 'Create new records in this module',
  },
  {
    code: 'template_static:read',
    name: 'Read Static Template Records',
    action: 'read',
    description: 'View and read records in this module',
  },
  {
    code: 'template_static:update',
    name: 'Update Static Template Records',
    action: 'update',
    description: 'Edit and update existing records in this module',
  },
  {
    code: 'template_static:delete',
    name: 'Delete Static Template Records',
    action: 'delete',
    description: 'Delete records in this module',
    isDangerous: true,
  },
  {
    code: 'template_static:export',
    name: 'Export Static Template Records',
    action: 'export',
    description: 'Export records to CSV files',
  },
  {
    code: 'template_static:*',
    name: 'Full Static Template Management',
    action: 'manage',
    description: 'Full access to all operations in this module',
  },
];


