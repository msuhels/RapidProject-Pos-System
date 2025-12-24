export interface PaymentPermissionDefinition {
  code: string;
  name: string;
  action: string;
  description: string;
  isDangerous: boolean;
  requiresMfa: boolean;
}

export const PAYMENT_PERMISSIONS: PaymentPermissionDefinition[] = [
  {
    code: 'payment_management:view_payment',
    name: 'View Payments',
    action: 'read',
    description: 'View payment records and history',
    isDangerous: false,
    requiresMfa: false,
  },
  {
    code: 'payment_management:create_payment',
    name: 'Create Payment',
    action: 'create',
    description: 'Record new payments',
    isDangerous: false,
    requiresMfa: false,
  },
  {
    code: 'payment_management:update_payment_status',
    name: 'Update Payment Status',
    action: 'update',
    description: 'Modify payment status and details',
    isDangerous: false,
    requiresMfa: false,
  },
  {
    code: 'payment_management:reverse_payment',
    name: 'Reverse Payment',
    action: 'execute',
    description: 'Reverse or refund payments (admin only)',
    isDangerous: true,
    requiresMfa: false,
  },
  {
    code: 'payment_management:manage_payment_methods',
    name: 'Manage Payment Methods',
    action: 'manage',
    description: 'Create, update, and delete payment methods',
    isDangerous: false,
    requiresMfa: false,
  },
  {
    code: 'payment_management:export',
    name: 'Export Payments',
    action: 'export',
    description: 'Export payment data to CSV',
    isDangerous: false,
    requiresMfa: false,
  },
  {
    code: 'payment_management:import',
    name: 'Import Payments',
    action: 'import',
    description: 'Import payment data from CSV',
    isDangerous: false,
    requiresMfa: false,
  },
  {
    code: 'payment_management:*',
    name: 'All Payment Permissions',
    action: 'manage',
    description: 'Wildcard - all payment management permissions',
    isDangerous: true,
    requiresMfa: false,
  },
];


