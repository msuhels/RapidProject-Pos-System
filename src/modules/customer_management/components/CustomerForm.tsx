'use client';

import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import type { CreateCustomerInput } from '../types';
import { useCustomerCustomFields } from '../hooks/useCustomerCustomFields';

interface CustomerFormProps {
  form: CreateCustomerInput;
  onChange: (form: CreateCustomerInput) => void;
}

const STANDARD_FIELD_CONFIG = [
  { code: 'name', label: 'Name', type: 'text' as const, required: true },
  { code: 'phone_number', label: 'Phone Number', type: 'text' as const, required: false },
  { code: 'email', label: 'Email', type: 'email' as const, required: false },
  { code: 'total_purchases', label: 'Total Purchases', type: 'number' as const, required: false },
  { code: 'outstanding_balance', label: 'Outstanding Balance', type: 'number' as const, required: false },
  { code: 'is_active', label: 'Is Active', type: 'boolean' as const, required: false },
] as const;

export function CustomerForm({ form, onChange }: CustomerFormProps) {
  const { isFieldVisible, isFieldEditable, loading: loadingPerms } =
    useFieldPermissions('customer_management');
  const { customFields, loading: loadingCustomFields } = useCustomerCustomFields();

  const updateField = <K extends keyof CreateCustomerInput>(
    key: K,
    value: CreateCustomerInput[K],
  ) => {
    onChange({ ...form, [key]: value });
  };

  const updateCustomField = (fieldCode: string, value: unknown) => {
    onChange({
      ...form,
      customFields: {
        ...(form.customFields ?? {}),
        [fieldCode]: value,
      },
    });
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

  const visibleStandardFields = STANDARD_FIELD_CONFIG.filter((field) =>
    isFieldVisible('customer_management', field.code),
  );

  const visibleCustomFields = customFields.filter((field) =>
    isFieldVisible('customer_management', field.code),
  );

  if (!visibleStandardFields.length && !visibleCustomFields.length && !loadingCustomFields) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No fields available. Contact your administrator for access.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleStandardFields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleStandardFields.map((field) => {
            const fieldKey = field.code as keyof CreateCustomerInput;
            let value: any = form[fieldKey];

            // Handle field code mapping
            if (field.code === 'phone_number') {
              value = form.phoneNumber ?? '';
            } else if (field.code === 'total_purchases') {
              value = form.totalPurchases ?? '';
            } else if (field.code === 'outstanding_balance') {
              value = form.outstandingBalance ?? '';
            } else if (field.code === 'is_active') {
              value = form.isActive ?? true;
            }

            const editable = isFieldEditable('customer_management', field.code);

            return (
              <div key={field.code}>
                <Label>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                  {!editable && (
                    <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                  )}
                </Label>

                {field.type === 'number' && (
                  <Input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => {
                      const numValue = parseFloat(e.target.value) || 0;
                      if (field.code === 'total_purchases') {
                        updateField('totalPurchases', numValue);
                      } else if (field.code === 'outstanding_balance') {
                        updateField('outstandingBalance', numValue);
                      }
                    }}
                    disabled={!editable}
                  />
                )}

                {field.type === 'email' && (
                  <Input
                    type="email"
                    value={value}
                    onChange={(e) => updateField('email', e.target.value)}
                    disabled={!editable}
                  />
                )}

                {field.type === 'boolean' && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updateField('isActive', e.target.checked)}
                      disabled={!editable}
                      className="rounded"
                    />
                    <span className="text-sm text-muted-foreground">
                      {value ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                )}

                {field.type === 'text' && (
                  <Input
                    value={value}
                    onChange={(e) => {
                      if (field.code === 'phone_number') {
                        updateField('phoneNumber', e.target.value);
                      } else {
                        updateField('name', e.target.value);
                      }
                    }}
                    disabled={!editable}
                    required={field.required}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {(visibleCustomFields.length > 0 || loadingCustomFields) && (
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Custom Fields</h3>
          {loadingCustomFields ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-10 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleCustomFields.map((field) => {
                const value = form.customFields?.[field.code] ?? '';
                const isRequired = field.metadata?.isRequired ?? false;
                const editable = isFieldEditable('customer_management', field.code);

                return (
                  <div key={field.id}>
                    <Label>
                      {field.label}
                      {isRequired && <span className="text-destructive ml-1">*</span>}
                      {!editable && (
                        <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                      )}
                    </Label>

                    {field.fieldType === 'number' && (
                      <Input
                        type="number"
                        step="0.01"
                        value={value as number}
                        onChange={(e) => updateCustomField(field.code, parseFloat(e.target.value) || 0)}
                        disabled={!editable}
                        required={isRequired}
                      />
                    )}

                    {field.fieldType === 'boolean' && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={value as boolean}
                          onChange={(e) => updateCustomField(field.code, e.target.checked)}
                          disabled={!editable}
                          className="rounded"
                        />
                        <span className="text-sm text-muted-foreground">
                          {value ? 'Yes' : 'No'}
                        </span>
                      </div>
                    )}

                    {(field.fieldType === 'text' || field.fieldType === 'email' || field.fieldType === 'url') && (
                      <Input
                        type={field.fieldType === 'email' ? 'email' : 'text'}
                        value={value as string}
                        onChange={(e) => updateCustomField(field.code, e.target.value)}
                        disabled={!editable}
                        required={isRequired}
                      />
                    )}

                    {field.fieldType === 'textarea' && (
                      <textarea
                        value={value as string}
                        onChange={(e) => updateCustomField(field.code, e.target.value)}
                        disabled={!editable}
                        required={isRequired}
                        className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md"
                        rows={3}
                      />
                    )}

                    {field.description && (
                      <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


