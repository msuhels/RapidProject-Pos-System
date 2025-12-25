export interface OrderPermissionDefinition {
  code: string;
  name: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'import' | 'duplicate' | 'manage_labels' | 'manage';
  description: string;
  isDangerous?: boolean;
  requiresMfa?: boolean;
}

export const ORDER_PERMISSIONS: OrderPermissionDefinition[] = [
  {
    code: 'orders:create',
    name: 'Create Orders',
    action: 'create',
    description: 'Create new order records',
  },
  {
    code: 'orders:read',
    name: 'Read Orders',
    action: 'read',
    description: 'View and read order records',
  },
  {
    code: 'orders:update',
    name: 'Update Orders',
    action: 'update',
    description: 'Edit and update existing order records',
  },
  {
    code: 'orders:delete',
    name: 'Delete Orders',
    action: 'delete',
    description: 'Delete order records',
    isDangerous: true,
  },
  {
    code: 'orders:export',
    name: 'Export Orders',
    action: 'export',
    description: 'Export order records to CSV files',
  },
  {
    code: 'orders:import',
    name: 'Import Orders',
    action: 'import',
    description: 'Import order records from CSV files',
  },
  {
    code: 'orders:duplicate',
    name: 'Duplicate Orders',
    action: 'duplicate',
    description: 'Duplicate existing order records',
  },
  {
    code: 'orders:manage_labels',
    name: 'Manage Order Labels',
    action: 'manage_labels',
    description: 'Create and manage order labels',
  },
  {
    code: 'orders:*',
    name: 'Full Order Management',
    action: 'manage',
    description: 'Full access to all order operations',
  },
];

