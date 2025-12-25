export interface OrderFieldDefinition {
  name: string;
  code: string;
  label: string;
  fieldType: 'text' | 'textarea' | 'select' | 'number' | 'url' | 'date';
  description?: string;
  sortOrder: number;
}

export const ORDER_FIELDS: OrderFieldDefinition[] = [
  {
    name: 'User Name',
    code: 'userName',
    label: 'User',
    fieldType: 'text',
    description: 'Name of the user who placed the order',
    sortOrder: 1,
  },
  {
    name: 'User ID',
    code: 'userId',
    label: 'User ID',
    fieldType: 'text',
    description: 'Reference to user who placed the order',
    sortOrder: 2,
  },
  {
    name: 'Order Date',
    code: 'orderDate',
    label: 'Order Date',
    fieldType: 'date',
    description: 'Date when the order was placed',
    sortOrder: 3,
  },
  {
    name: 'Products',
    code: 'products',
    label: 'Products',
    fieldType: 'textarea',
    description: 'List of products in the order',
    sortOrder: 4,
  },
  {
    name: 'Total Amount',
    code: 'totalAmount',
    label: 'Total Amount',
    fieldType: 'text',
    description: 'Total amount of the order',
    sortOrder: 5,
  },
];

