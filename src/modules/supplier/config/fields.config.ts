export interface SupplierFieldDefinition {
  name: string;
  code: string;
  label: string;
  fieldType: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea' | 'boolean' | 'url' | 'phone';
  description?: string;
  sortOrder: number;
}

export const SUPPLIER_FIELDS: SupplierFieldDefinition[] = [
  {
    name: 'Supplier Code',
    code: 'supplier_code',
    label: 'Supplier Code',
    fieldType: 'text',
    description: 'Unique internal reference for the supplier',
    sortOrder: 1,
  },
  {
    name: 'Supplier Name',
    code: 'supplier_name',
    label: 'Supplier Name',
    fieldType: 'text',
    description: 'Legal or trade name of the supplier',
    sortOrder: 2,
  },
  {
    name: 'Contact Person',
    code: 'contact_person',
    label: 'Contact Person',
    fieldType: 'text',
    description: 'Primary contact person name',
    sortOrder: 3,
  },
  {
    name: 'Email',
    code: 'email',
    label: 'Email',
    fieldType: 'email',
    description: 'Supplier contact email address',
    sortOrder: 4,
  },
  {
    name: 'Phone',
    code: 'phone',
    label: 'Phone',
    fieldType: 'phone',
    description: 'Supplier contact phone number',
    sortOrder: 5,
  },
  {
    name: 'Address',
    code: 'address',
    label: 'Address',
    fieldType: 'textarea',
    description: 'Supplier address details',
    sortOrder: 6,
  },
  {
    name: 'Status',
    code: 'status',
    label: 'Status',
    fieldType: 'select',
    description: 'Current supplier status',
    sortOrder: 7,
  },
];

