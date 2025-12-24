export interface CartFieldDefinition {
  name: string;
  code: string;
  label: string;
  fieldType: 'text' | 'textarea' | 'select' | 'number' | 'url';
  description?: string;
  sortOrder: number;
}

export const CART_FIELDS: CartFieldDefinition[] = [
  {
    name: 'Product',
    code: 'product',
    label: 'Product',
    fieldType: 'text',
    description: 'Product details (name, image, price)',
    sortOrder: 1,
  },
  {
    name: 'Quantity',
    code: 'quantity',
    label: 'Quantity',
    fieldType: 'text',
    description: 'Product quantity in cart',
    sortOrder: 2,
  },
  {
    name: 'User ID',
    code: 'userId',
    label: 'User ID',
    fieldType: 'text',
    description: 'Reference to user',
    sortOrder: 3,
  },
];

