export interface CustomerPermissionDefinition {
  code: string;
  name: string;
  action: string;
  description: string;
  isDangerous: boolean;
  requiresMfa: boolean;
}

export const CUSTOMER_PERMISSIONS: CustomerPermissionDefinition[] = [
  {
    code: 'customer_management:create',
    name: 'Create Customer',
    action: 'create',
    description: 'Create new customer records',
    isDangerous: false,
    requiresMfa: false,
  },
  {
    code: 'customer_management:read',
    name: 'View Customers',
    action: 'read',
    description: 'View customer details and list',
    isDangerous: false,
    requiresMfa: false,
  },
  {
    code: 'customer_management:update',
    name: 'Edit Customer',
    action: 'update',
    description: 'Modify customer information',
    isDangerous: false,
    requiresMfa: false,
  },
  {
    code: 'customer_management:deactivate',
    name: 'Deactivate Customer',
    action: 'deactivate',
    description: 'Deactivate customer (soft delete)',
    isDangerous: false,
    requiresMfa: false,
  },
  {
    code: 'customer_management:delete',
    name: 'Delete Customer',
    action: 'delete',
    description: 'Permanently delete customer records',
    isDangerous: true,
    requiresMfa: false,
  },
  {
    code: 'customer_management:export',
    name: 'Export Customers',
    action: 'export',
    description: 'Export customer data to CSV',
    isDangerous: false,
    requiresMfa: false,
  },
  {
    code: 'customer_management:import',
    name: 'Import Customers',
    action: 'import',
    description: 'Import customer data from CSV',
    isDangerous: false,
    requiresMfa: false,
  },
  {
    code: 'customer_management:*',
    name: 'All Customer Permissions',
    action: 'manage',
    description: 'Wildcard - all customer management permissions',
    isDangerous: true,
    requiresMfa: false,
  },
];

