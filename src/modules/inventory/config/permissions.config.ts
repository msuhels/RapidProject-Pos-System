export interface InventoryPermissionDefinition {
  code: string;
  name: string;
  action:
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'export'
    | 'import'
    | 'duplicate'
    | 'manage_labels'
    | 'manage';
  description: string;
  isDangerous?: boolean;
  requiresMfa?: boolean;
}

export const INVENTORY_PERMISSIONS: InventoryPermissionDefinition[] = [
  {
    code: 'inventory:read',
    name: 'Read Inventory Records',
    action: 'read',
    description: 'View and read inventory records',
  },
  {
    code: 'inventory:update',
    name: 'Update Inventory Records',
    action: 'update',
    description: 'Edit and update existing inventory records',
  },
  {
    code: 'inventory:delete',
    name: 'Delete Inventory Records',
    action: 'delete',
    description: 'Delete inventory records',
    isDangerous: true,
  },
  {
    code: 'inventory:export',
    name: 'Export Inventory Records',
    action: 'export',
    description: 'Export inventory records to CSV files',
  },
  {
    code: 'inventory:import',
    name: 'Import Inventory Records',
    action: 'import',
    description: 'Import inventory records from CSV files',
  },
  {
    code: 'inventory:duplicate',
    name: 'Duplicate Inventory Records',
    action: 'duplicate',
    description: 'Duplicate existing inventory records',
  },
  {
    code: 'inventory:manage_labels',
    name: 'Manage Inventory Labels',
    action: 'manage_labels',
    description: 'Create and manage inventory labels',
  },
  {
    code: 'inventory:*',
    name: 'Full Inventory Management',
    action: 'manage',
    description: 'Full access to all inventory operations',
  },
];


