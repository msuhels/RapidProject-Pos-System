export interface PaymentFieldDefinition {
  name: string;
  code: string;
  label: string;
  fieldType: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea' | 'boolean' | 'url' | 'datetime';
  description?: string;
  sortOrder: number;
}

export const PAYMENT_FIELDS: PaymentFieldDefinition[] = [
  {
    name: 'Sale Reference',
    code: 'sale_reference',
    label: 'Sale Reference',
    fieldType: 'text',
    description: 'Reference ID or foreign key to the related sale/invoice',
    sortOrder: 1,
  },
  {
    name: 'Payment Method',
    code: 'payment_method_id',
    label: 'Payment Method',
    fieldType: 'select',
    description: 'Linked payment method (cash, card, UPI, etc.)',
    sortOrder: 2,
  },
  {
    name: 'Amount',
    code: 'amount',
    label: 'Amount',
    fieldType: 'number',
    description: 'Payment amount',
    sortOrder: 3,
  },
  {
    name: 'Payment Status',
    code: 'payment_status',
    label: 'Payment Status',
    fieldType: 'select',
    description: 'Current status of the payment',
    sortOrder: 4,
  },
  {
    name: 'Transaction Reference',
    code: 'transaction_reference',
    label: 'Transaction Reference',
    fieldType: 'text',
    description: 'External transaction ID (optional)',
    sortOrder: 5,
  },
  {
    name: 'Payment Date',
    code: 'payment_date',
    label: 'Payment Date',
    fieldType: 'datetime',
    description: 'Date and time of payment',
    sortOrder: 6,
  },
  {
    name: 'Notes',
    code: 'notes',
    label: 'Notes',
    fieldType: 'textarea',
    description: 'Optional remarks',
    sortOrder: 7,
  },
  {
    name: 'Is Reversed',
    code: 'is_reversed',
    label: 'Is Reversed',
    fieldType: 'boolean',
    description: 'Indicates if the payment has been reversed',
    sortOrder: 8,
  },
];

