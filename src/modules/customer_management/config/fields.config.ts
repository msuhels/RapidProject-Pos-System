export interface CustomerFieldDefinition {
  name: string;
  code: string;
  label: string;
  fieldType: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea' | 'boolean' | 'url' | 'phone';
  description?: string;
  sortOrder: number;
}

export const CUSTOMER_FIELDS: CustomerFieldDefinition[] = [
  {
    name: 'Name',
    code: 'name',
    label: 'Name',
    fieldType: 'text',
    description: 'Customer full name',
    sortOrder: 1,
  },
  {
    name: 'Phone Number',
    code: 'phone_number',
    label: 'Phone Number',
    fieldType: 'phone',
    description: 'Primary contact number of the customer',
    sortOrder: 2,
  },
  {
    name: 'Email',
    code: 'email',
    label: 'Email',
    fieldType: 'email',
    description: 'Email address of the customer',
    sortOrder: 3,
  },
  {
    name: 'Total Purchases',
    code: 'total_purchases',
    label: 'Total Purchases',
    fieldType: 'number',
    description: 'Aggregated total value of all completed purchases',
    sortOrder: 4,
  },
  {
    name: 'Outstanding Balance',
    code: 'outstanding_balance',
    label: 'Outstanding Balance',
    fieldType: 'number',
    description: 'Pending or unpaid balance amount',
    sortOrder: 5,
  },
  {
    name: 'Is Active',
    code: 'is_active',
    label: 'Is Active',
    fieldType: 'boolean',
    description: 'Indicates whether the customer is active or deactivated',
    sortOrder: 6,
  },
];

