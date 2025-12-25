'use client';

import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Select } from '@/core/components/ui/select';
import { Textarea } from '@/core/components/ui/textarea';
import type { CreateStockAdjustmentInput } from '../types';
import type { Product } from '../../products/types';

interface StockAdjustmentFormProps {
  form: CreateStockAdjustmentInput & { productName?: string };
  products: Product[];
  onChange: (form: CreateStockAdjustmentInput) => void;
}

const REASON_OPTIONS = [
  { value: 'damage', label: 'Damage' },
  { value: 'manual_correction', label: 'Manual Correction' },
  { value: 'theft', label: 'Theft' },
  { value: 'expired', label: 'Expired' },
  { value: 'returned', label: 'Returned' },
  { value: 'found', label: 'Found' },
  { value: 'other', label: 'Other' },
];

export function StockAdjustmentForm({ form, products, onChange }: StockAdjustmentFormProps) {
  const selectedProduct = products.find((p) => p.id === form.productId);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="productId">Product *</Label>
        <Select
          id="productId"
          value={form.productId}
          onChange={(e) => {
            const product = products.find((p) => p.id === e.target.value);
            onChange({
              ...form,
              productId: e.target.value,
              productName: product?.name,
            });
          }}
          options={[
            { value: '', label: 'Select a product' },
            ...products.map((p) => ({ value: p.id, label: `${p.name} (Qty: ${p.quantity})` })),
          ]}
          className="w-full"
        />
        {selectedProduct && (
          <p className="text-sm text-muted-foreground mt-1">
            Current stock: {selectedProduct.quantity}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="adjustmentType">Adjustment Type *</Label>
        <Select
          id="adjustmentType"
          value={form.adjustmentType || 'increase'}
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'increase' || value === 'decrease') {
              onChange({
                ...form,
                adjustmentType: value,
              });
            }
          }}
          options={[
            { value: 'increase', label: 'Increase Stock' },
            { value: 'decrease', label: 'Decrease Stock' },
          ]}
          className="w-full"
        />
      </div>

      <div>
        <Label htmlFor="quantity">Quantity *</Label>
        <Input
          id="quantity"
          type="number"
          min="0.01"
          step="0.01"
          value={form.quantity || ''}
          onChange={(e) =>
            onChange({
              ...form,
              quantity: parseFloat(e.target.value) || 0,
            })
          }
          placeholder="Enter quantity"
        />
      </div>

      <div>
        <Label htmlFor="reason">Reason *</Label>
        <Select
          id="reason"
          value={form.reason}
          onChange={(e) =>
            onChange({
              ...form,
              reason: e.target.value,
            })
          }
          options={[
            { value: '', label: 'Select a reason' },
            ...REASON_OPTIONS,
          ]}
          className="w-full"
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={form.notes || ''}
          onChange={(e) =>
            onChange({
              ...form,
              notes: e.target.value,
            })
          }
          placeholder="Optional notes about this adjustment"
          rows={3}
        />
      </div>
    </div>
  );
}

