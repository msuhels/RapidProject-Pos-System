'use client';

import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { Select } from '@/core/components/ui/select';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import type { CreateSupplierInput } from '../types';
import { useSupplierCustomFields } from '../hooks/useSupplierCustomFields';

interface SupplierFormProps {
  form: CreateSupplierInput;
  onChange: (form: CreateSupplierInput) => void;
}

const STANDARD_FIELD_CONFIG = [
  { code: 'supplier_code', label: 'Supplier Code', type: 'text' as const, required: true },
  { code: 'supplier_name', label: 'Supplier Name', type: 'text' as const, required: true },
  { code: 'contact_person', label: 'Contact Person', type: 'text' as const, required: false },
  { code: 'email', label: 'Email', type: 'email' as const, required: false },
  { code: 'phone', label: 'Phone', type: 'text' as const, required: false },
  { code: 'address', label: 'Address', type: 'textarea' as const, required: false },
  { code: 'status', label: 'Status', type: 'select' as const, required: false },
] as const;

export function SupplierForm({ form, onChange }: SupplierFormProps) {
  const { isFieldVisible, isFieldEditable, loading: loadingPerms } =
    useFieldPermissions('supplier');
  const { customFields, loading: loadingCustomFields } = useSupplierCustomFields();

  const updateField = <K extends keyof CreateSupplierInput>(
    key: K,
    value: CreateSupplierInput[K],
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
    isFieldVisible('supplier', field.code),
  );

  const visibleCustomFields = customFields.filter((field) =>
    isFieldVisible('supplier', field.code),
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
            const fieldKey = field.code as keyof CreateSupplierInput;
            let value: any = form[fieldKey];

            // Handle field code mapping
            if (field.code === 'supplier_code') {
              value = form.supplierCode ?? '';
            } else if (field.code === 'supplier_name') {
              value = form.supplierName ?? '';
            } else if (field.code === 'contact_person') {
              value = form.contactPerson ?? '';
            }

            const editable = isFieldEditable('supplier', field.code);

            return (
              <div key={field.code} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <Label>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                  {!editable && (
                    <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                  )}
                </Label>

                {field.type === 'text' && (
                  <Input
                    value={value}
                    onChange={(e) => {
                      if (field.code === 'supplier_code') {
                        updateField('supplierCode', e.target.value);
                      } else if (field.code === 'supplier_name') {
                        updateField('supplierName', e.target.value);
                      } else if (field.code === 'contact_person') {
                        updateField('contactPerson', e.target.value);
                      } else if (field.code === 'phone') {
                        updateField('phone', e.target.value);
                      }
                    }}
                    disabled={!editable}
                    required={field.required}
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

                {field.type === 'textarea' && (
                  <Textarea
                    value={value}
                    onChange={(e) => updateField('address', e.target.value)}
                    disabled={!editable}
                    rows={3}
                  />
                )}

                {field.type === 'select' && field.code === 'status' && (
                  <Select
                    value={form.status || 'active'}
                    onChange={(e) => updateField('status', e.target.value as 'active' | 'inactive')}
                    disabled={!editable}
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                    ]}
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
                const editable = isFieldEditable('supplier', field.code);

                return (
                  <div key={field.id} className={field.fieldType === 'textarea' ? 'md:col-span-2' : ''}>
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
                      <Textarea
                        value={value as string}
                        onChange={(e) => updateCustomField(field.code, e.target.value)}
                        disabled={!editable}
                        required={isRequired}
                        rows={3}
                      />
                    )}

                    {field.fieldType === 'select' && field.metadata?.options && (
                      <Select
                        value={value as string}
                        onChange={(e) => updateCustomField(field.code, e.target.value)}
                        disabled={!editable}
                        options={field.metadata.options.map((opt) => ({ value: opt, label: opt }))}
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

