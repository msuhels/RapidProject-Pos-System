export interface InventoryFieldDefinition {
  name: string;
  code: string;
  label: string;
  fieldType: 'text' | 'textarea' | 'select' | 'number' | 'url';
  description?: string;
  sortOrder: number;
}

export const INVENTORY_FIELDS: InventoryFieldDefinition[] = [
  {
    name: 'Product Name',
    code: 'name',
    label: 'Product Name',
    fieldType: 'text',
    description: 'Product name',
    sortOrder: 1,
  },
  {
    name: 'SKU',
    code: 'sku',
    label: 'SKU',
    fieldType: 'text',
    description: 'Stock keeping unit',
    sortOrder: 2,
  },
  {
    name: 'Location',
    code: 'location',
    label: 'Location',
    fieldType: 'text',
    description: 'Inventory storage location',
    sortOrder: 3,
  },
  {
    name: 'Quantity',
    code: 'quantity',
    label: 'Quantity',
    fieldType: 'number',
    description: 'Quantity on hand',
    sortOrder: 4,
  },
  {
    name: 'Status',
    code: 'status',
    label: 'Status',
    fieldType: 'select',
    description: 'Inventory status (In Stock, Low Stock, Out of Stock)',
    sortOrder: 5,
  },
  {
    name: 'Price',
    code: 'price',
    label: 'Price',
    fieldType: 'text',
    description: 'Product price',
    sortOrder: 6,
  },
];


