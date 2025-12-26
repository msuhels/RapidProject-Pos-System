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
    label: 'Base Price',
    fieldType: 'number',
    description: 'Original product price before discount and tax',
    sortOrder: 2,
  },
  {
    name: 'DiscountType',
    code: 'discountType',
    label: 'Discount Type',
    fieldType: 'select',
    description: 'Discount type (percentage or amount)',
    sortOrder: 3,
  },
  {
    name: 'DiscountValue',
    code: 'discountValue',
    label: 'Discount Value',
    fieldType: 'number',
    description: 'Discount value (percentage or amount)',
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
    name: 'CostPrice',
    code: 'costPrice',
    label: 'Cost Price',
    fieldType: 'number',
    description: 'Product cost price (for profit calculation)',
    sortOrder: 6,
  },
  {
    name: 'SellingPrice',
    code: 'sellingPrice',
    label: 'Selling Price',
    fieldType: 'number',
    description: 'Final selling price (auto-calculated: Price - Discount + Tax)',
    sortOrder: 7,
  },
  {
    name: 'Quantity',
    code: 'quantity',
    label: 'Current Stock Quantity',
    fieldType: 'number',
    description: 'Current available stock quantity',
    sortOrder: 8,
  },
  {
    name: 'MinimumStockQuantity',
    code: 'minimumStockQuantity',
    label: 'Minimum Stock Quantity (MSQ)',
    fieldType: 'number',
    description: 'Minimum stock level before reorder alert - Required field',
    sortOrder: 9,
  },
  {
    name: 'Supplier',
    code: 'supplierId',
    label: 'Supplier',
    fieldType: 'select',
    description: 'Select supplier for this product',
    sortOrder: 10,
  },
  {
    name: 'Image',
    code: 'image',
    label: 'Image URL',
    fieldType: 'url',
    description: 'Product image URL',
    sortOrder: 11,
  },
  {
    name: 'Category',
    code: 'category',
    label: 'Category',
    fieldType: 'text',
    description: 'Product category',
    sortOrder: 12,
  },
  {
    name: 'SKU',
    code: 'sku',
    label: 'SKU / Barcode',
    fieldType: 'text',
    description: 'Stock keeping unit',
    sortOrder: 13,
  },
  {
    name: 'Location',
    code: 'location',
    label: 'Location',
    fieldType: 'text',
    description: 'Inventory storage location',
    sortOrder: 14,
  },
];

