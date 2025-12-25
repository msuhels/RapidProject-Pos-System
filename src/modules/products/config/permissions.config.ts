export interface ProductPermissionDefinition {
  code: string;
  name: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'import' | 'duplicate' | 'manage_labels' | 'manage';
  description: string;
  isDangerous?: boolean;
  requiresMfa?: boolean;
}

export const PRODUCT_PERMISSIONS: ProductPermissionDefinition[] = [
  {
    code: 'products:create',
    name: 'Create Products',
    action: 'create',
    description: 'Create new products',
  },
  {
    code: 'products:read',
    name: 'Read Products',
    action: 'read',
    description: 'View and read products',
  },
  {
    code: 'products:update',
    name: 'Update Products',
    action: 'update',
    description: 'Edit and update existing products',
  },
  {
    code: 'products:delete',
    name: 'Delete Products',
    action: 'delete',
    description: 'Delete products',
    isDangerous: true,
  },
  {
    code: 'products:export',
    name: 'Export Products',
    action: 'export',
    description: 'Export products to CSV files',
  },
  {
    code: 'products:import',
    name: 'Import Products',
    action: 'import',
    description: 'Import products from CSV files',
  },
  {
    code: 'products:duplicate',
    name: 'Duplicate Products',
    action: 'duplicate',
    description: 'Duplicate existing products',
  },
  {
    code: 'products:manage_labels',
    name: 'Manage Product Labels',
    action: 'manage_labels',
    description: 'Create and manage product labels',
  },
  {
    code: 'products:*',
    name: 'Full Product Management',
    action: 'manage',
    description: 'Full access to all product operations',
  },
];


