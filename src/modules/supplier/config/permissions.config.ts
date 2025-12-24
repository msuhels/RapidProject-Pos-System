export interface SupplierPermissionDefinition {
  code: string;
  name: string;
  action: string;
  description: string;
  isDangerous: boolean;
  requiresMfa: boolean;
}

export const SUPPLIER_PERMISSIONS: SupplierPermissionDefinition[] = [
  {
    code: 'supplier:create',
    name: 'Create Supplier',
    action: 'create',
    description: 'Create new supplier records',
    isDangerous: false,
    requiresMfa: false,
  },
  {
    code: 'supplier:read',
    name: 'View Suppliers',
    action: 'read',
    description: 'View supplier details and list',
    isDangerous: false,
    requiresMfa: false,
  },
  {
    code: 'supplier:update',
    name: 'Edit Supplier',
    action: 'update',
    description: 'Modify supplier information',
    isDangerous: false,
    requiresMfa: false,
  },
  {
    code: 'supplier:delete',
    name: 'Delete Supplier',
    action: 'delete',
    description: 'Permanently delete supplier records',
    isDangerous: true,
    requiresMfa: false,
  },
  {
    code: 'supplier:*',
    name: 'All Supplier Permissions',
    action: 'manage',
    description: 'Wildcard - all supplier management permissions',
    isDangerous: true,
    requiresMfa: false,
  },
];

