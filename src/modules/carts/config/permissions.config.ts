export interface CartPermissionDefinition {
  code: string;
  name: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'import' | 'duplicate' | 'manage_labels' | 'manage';
  description: string;
  isDangerous?: boolean;
  requiresMfa?: boolean;
}

export const CART_PERMISSIONS: CartPermissionDefinition[] = [
  {
    code: 'carts:create',
    name: 'Create Carts',
    action: 'create',
    description: 'Create new cart items',
  },
  {
    code: 'carts:read',
    name: 'Read Carts',
    action: 'read',
    description: 'View and read cart items',
  },
  {
    code: 'carts:update',
    name: 'Update Carts',
    action: 'update',
    description: 'Edit and update existing cart items',
  },
  {
    code: 'carts:delete',
    name: 'Delete Carts',
    action: 'delete',
    description: 'Delete cart items',
    isDangerous: true,
  },
  {
    code: 'carts:export',
    name: 'Export Carts',
    action: 'export',
    description: 'Export cart items to CSV files',
  },
  {
    code: 'carts:import',
    name: 'Import Carts',
    action: 'import',
    description: 'Import cart items from CSV files',
  },
  {
    code: 'carts:duplicate',
    name: 'Duplicate Carts',
    action: 'duplicate',
    description: 'Duplicate existing cart items',
  },
  {
    code: 'carts:manage_labels',
    name: 'Manage Cart Labels',
    action: 'manage_labels',
    description: 'Create and manage cart labels',
  },
  {
    code: 'carts:*',
    name: 'Full Cart Management',
    action: 'manage',
    description: 'Full access to all cart operations',
  },
];

