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
    name: 'CostPrice',
    code: 'costPrice',
    label: 'Cost Price',
    fieldType: 'number',
    description: 'Product cost price',
    sortOrder: 3,
  },
  {
    name: 'SellingPrice',
    code: 'sellingPrice',
    label: 'Selling Price',
    fieldType: 'number',
    description: 'Product selling price',
    sortOrder: 4,
  },
  {
    name: 'TaxRate',
    code: 'taxRate',
    label: 'Tax Rate',
    fieldType: 'number',
    description: 'Tax rate percentage',
    sortOrder: 5,
  },
  {
    name: 'Quantity',
    code: 'quantity',
    label: 'Stock Quantity',
    fieldType: 'text',
    description: 'Product quantity',
    sortOrder: 6,
  },
  {
    name: 'Image',
    code: 'image',
    label: 'Image URL',
    fieldType: 'url',
    description: 'Product image URL',
    sortOrder: 7,
  },
  {
    name: 'Category',
    code: 'category',
    label: 'Category',
    fieldType: 'text',
    description: 'Product category',
    sortOrder: 8,
  },
  {
    name: 'SKU',
    code: 'sku',
    label: 'SKU / Barcode',
    fieldType: 'text',
    description: 'Stock keeping unit',
    sortOrder: 9,
  },
  {
    name: 'Location',
    code: 'location',
    label: 'Location',
    fieldType: 'text',
    description: 'Inventory storage location',
    sortOrder: 10,
  },
  {
    name: 'Status',
    code: 'status',
    label: 'Status',
    fieldType: 'select',
    description: 'Inventory status (In Stock, Low Stock, Out of Stock)',
    sortOrder: 11,
  },
];

