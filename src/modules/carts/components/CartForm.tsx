'use client';

import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import type { CreateCartInput } from '../types';

interface CartFormProps {
  form: CreateCartInput;
  onChange: (form: CreateCartInput) => void;
}

const STANDARD_FIELD_CONFIG = [
  { code: 'productId', label: 'Product ID', type: 'text' as const },
  { code: 'quantity', label: 'Quantity', type: 'text' as const },
  { code: 'userId', label: 'User ID', type: 'text' as const },
] as const;

export function CartForm({ form, onChange }: CartFormProps) {
  const { isFieldVisible, isFieldEditable, loading: loadingPerms } =
    useFieldPermissions('carts');

  const updateField = <K extends keyof CreateCartInput>(
    key: K,
    value: CreateCartInput[K],
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
    isFieldVisible('carts', field.code),
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
          const editable = isFieldEditable('carts', field.code);

          return (
            <div key={field.code}>
              <Label>
                {field.label}
                {!editable && (
                  <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                )}
              </Label>
              <Input
                type="text"
                value={value}
                onChange={(e) =>
                  updateField(field.code as keyof CreateCartInput, e.target.value)
                }
                disabled={!editable}
                placeholder={field.label}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

