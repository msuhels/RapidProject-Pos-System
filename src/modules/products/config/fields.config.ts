export interface ProductFieldDefinition {
  name: string;
  code: string;
  label: string;
  fieldType: 'text' | 'textarea' | 'select' | 'number' | 'url';
  description?: string;
  sortOrder: number;
}

export const PRODUCT_FIELDS: ProductFieldDefinition[] = [
  {
    name: 'Name',
    code: 'name',
    label: 'Product Name',
    fieldType: 'text',
    description: 'Product name',
    sortOrder: 1,
  },
  {
    name: 'Price',
    code: 'price',
    label: 'Price',
    fieldType: 'text',
    description: 'Product price',
    sortOrder: 2,
  },
  {
    name: 'Quantity',
    code: 'quantity',
    label: 'Quantity',
    fieldType: 'text',
    description: 'Product quantity',
    sortOrder: 3,
  },
  {
    name: 'Image',
    code: 'image',
    label: 'Image URL',
    fieldType: 'url',
    description: 'Product image URL',
    sortOrder: 4,
  },
  {
    name: 'Category',
    code: 'category',
    label: 'Category',
    fieldType: 'text',
    description: 'Product category',
    sortOrder: 5,
  },
  {
    name: 'SKU',
    code: 'sku',
    label: 'SKU',
    fieldType: 'text',
    description: 'Stock keeping unit',
    sortOrder: 6,
  },
  {
    name: 'Location',
    code: 'location',
    label: 'Location',
    fieldType: 'text',
    description: 'Inventory storage location',
    sortOrder: 7,
  },
  {
    name: 'Status',
    code: 'status',
    label: 'Status',
    fieldType: 'select',
    description: 'Inventory status (In Stock, Low Stock, Out of Stock)',
    sortOrder: 8,
  },
];

