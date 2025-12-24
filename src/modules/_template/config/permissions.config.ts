/**
 * Template Module Permissions Configuration
 *
 * Copy this file when creating a new module and:
 * 1. Replace 'template' with your module id/name
 * 2. Update permission codes and names
 * 3. Adjust action types as needed
 */

export interface TemplateModulePermissionDefinition {
  code: string;
  name: string;
  action:
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'import'
    | 'export'
    | 'manage_labels'
    | 'manage';
  description: string;
  isDangerous?: boolean;
  requiresMfa?: boolean;
}

export const TEMPLATE_PERMISSIONS: TemplateModulePermissionDefinition[] = [
  // Basic CRUD permissions
  {
    code: 'template:create',
    name: 'Create Template Records',
    action: 'create',
    description: 'Create new records in this module',
  },
  {
    code: 'template:read',
    name: 'Read Template Records',
    action: 'read',
    description: 'View and read records in this module',
  },
  {
    code: 'template:update',
    name: 'Update Template Records',
    action: 'update',
    description: 'Edit and update existing records in this module',
  },
  {
    code: 'template:delete',
    name: 'Delete Template Records',
    action: 'delete',
    description: 'Delete records in this module',
    isDangerous: true,
  },
  // Import/Export permissions
  {
    code: 'template:import',
    name: 'Import Template Records',
    action: 'import',
    description: 'Import records from CSV/Excel files',
  },
  {
    code: 'template:export',
    name: 'Export Template Records',
    action: 'export',
    description: 'Export records to CSV/Excel files',
  },
  // Full management permission (wildcard)
  {
    code: 'template:*',
    name: 'Full Template Module Management',
    action: 'manage',
    description: 'Full access to all operations in this module',
  },
];


