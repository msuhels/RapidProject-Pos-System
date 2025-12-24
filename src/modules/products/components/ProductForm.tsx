'use client';

import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Select } from '@/core/components/ui/select';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import type { CreateProductInput } from '../types';

interface ProductFormProps {
  form: CreateProductInput;
  onChange: (form: CreateProductInput) => void;
}

const STATUS_OPTIONS = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

const STANDARD_FIELD_CONFIG = [
  { code: 'name', label: 'Product Name', type: 'text' as const },
  { code: 'price', label: 'Price', type: 'text' as const },
  { code: 'quantity', label: 'Quantity', type: 'text' as const },
  { code: 'image', label: 'Image URL', type: 'url' as const },
  { code: 'category', label: 'Category', type: 'text' as const },
  { code: 'sku', label: 'SKU / Barcode', type: 'text' as const },
  { code: 'location', label: 'Location', type: 'text' as const },
  { code: 'status', label: 'Status', type: 'select' as const },
  { code: 'costPrice', label: 'Cost Price', type: 'number' as const },
  { code: 'sellingPrice', label: 'Selling Price', type: 'number' as const },
  { code: 'taxRate', label: 'Tax Rate', type: 'number' as const },
] as const;

export function ProductForm({ form, onChange }: ProductFormProps) {
  const { isFieldVisible, isFieldEditable, loading: loadingPerms } =
    useFieldPermissions('products');

  const updateField = <K extends keyof CreateProductInput>(
    key: K,
    value: CreateProductInput[K],
  ) => {
    onChange({ ...form, [key]: value });
  };

  if (loadingPerms) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-10 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const visibleFields = STANDARD_FIELD_CONFIG.filter((field) =>
    isFieldVisible('products', field.code),
  );

  if (!visibleFields.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No fields available. Contact your administrator for access.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleFields.map((field) => {
          const value = (form as any)[field.code] ?? '';
          const editable = isFieldEditable('products', field.code);

          return (
            <div key={field.code}>
              <Label>
                {field.label}
                {!editable && (
                  <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                )}
              </Label>
              {field.type === 'select' && field.code === 'status' ? (
                <Select
                  value={value || 'in_stock'}
                  onChange={(e) =>
                    updateField(field.code as keyof CreateProductInput, e.target.value)
                  }
                  options={STATUS_OPTIONS}
                  disabled={!editable}
                  className="w-full"
                />
              ) : (
                <Input
                  type={field.type === 'url' ? 'url' : 'text'}
                  value={value}
                  onChange={(e) =>
                    updateField(field.code as keyof CreateProductInput, e.target.value)
                  }
                  disabled={!editable}
                  placeholder={field.label}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

