'use client';

import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { Select } from '@/core/components/ui/select';
import { Checkbox } from '@/core/components/ui/checkbox';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import type { CreatePaymentInput, PaymentMethod } from '../types';
import { usePaymentCustomFields } from '../hooks/usePaymentCustomFields';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/core/store/authStore';

interface PaymentFormProps {
  form: CreatePaymentInput;
  onChange: (form: CreatePaymentInput) => void;
  paymentMethods?: PaymentMethod[];
}

const STANDARD_FIELD_CONFIG = [
  { code: 'sale_reference', label: 'Sale Reference', type: 'text' as const, required: true },
  { code: 'payment_method_id', label: 'Payment Method', type: 'select' as const, required: true },
  { code: 'amount', label: 'Amount', type: 'number' as const, required: true },
  { code: 'payment_status', label: 'Payment Status', type: 'select' as const, required: false },
  { code: 'transaction_reference', label: 'Transaction Reference', type: 'text' as const, required: false },
  { code: 'payment_date', label: 'Payment Date', type: 'datetime' as const, required: false },
  { code: 'notes', label: 'Notes', type: 'textarea' as const, required: false },
] as const;

export function PaymentForm({ form, onChange, paymentMethods = [] }: PaymentFormProps) {
  const { isFieldVisible, isFieldEditable, loading: loadingPerms } =
    useFieldPermissions('payment_management');
  const { customFields, loading: loadingCustomFields } = usePaymentCustomFields();
  const { accessToken } = useAuthStore();
  const [methods, setMethods] = useState<PaymentMethod[]>(paymentMethods);

  // Fetch payment methods if not provided
  useEffect(() => {
    if (paymentMethods.length === 0 && accessToken) {
      fetch('/api/payments/methods', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setMethods(data.data.filter((m: PaymentMethod) => m.isActive));
          }
        })
        .catch(console.error);
    }
  }, [paymentMethods.length, accessToken]);

  const updateField = <K extends keyof CreatePaymentInput>(
    key: K,
    value: CreatePaymentInput[K],
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
    isFieldVisible('payment_management', field.code),
  );

  const visibleCustomFields = customFields.filter((field) =>
    isFieldVisible('payment_management', field.code),
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
            const editable = isFieldEditable('payment_management', field.code);

            if (field.code === 'sale_reference') {
              return (
                <div key={field.code}>
                  <Label>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <Input
                    value={form.saleReference || ''}
                    onChange={(e) => updateField('saleReference', e.target.value)}
                    disabled={!editable}
                    required={field.required}
                  />
                </div>
              );
            }

            if (field.code === 'payment_method_id') {
              return (
                <div key={field.code}>
                  <Label>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <Select
                    value={form.paymentMethodId || ''}
                    onChange={(e) => updateField('paymentMethodId', e.target.value)}
                    disabled={!editable}
                    required={field.required}
                    options={methods.map((method) => ({
                      value: method.id,
                      label: method.name,
                    }))}
                  />
                </div>
              );
            }

            if (field.code === 'amount') {
              return (
                <div key={field.code}>
                  <Label>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.amount || ''}
                    onChange={(e) => updateField('amount', parseFloat(e.target.value) || 0)}
                    disabled={!editable}
                    required={field.required}
                  />
                </div>
              );
            }

            if (field.code === 'payment_status') {
              return (
                <div key={field.code}>
                  <Label>{field.label}</Label>
                  <Select
                    value={form.paymentStatus || 'paid'}
                    onChange={(e) => updateField('paymentStatus', e.target.value as any)}
                    disabled={!editable}
                    options={[
                      { value: 'paid', label: 'Paid' },
                      { value: 'partial', label: 'Partial' },
                      { value: 'refunded', label: 'Refunded' },
                    ]}
                  />
                </div>
              );
            }

            if (field.code === 'transaction_reference') {
              return (
                <div key={field.code}>
                  <Label>{field.label}</Label>
                  <Input
                    value={form.transactionReference || ''}
                    onChange={(e) => updateField('transactionReference', e.target.value || null)}
                    disabled={!editable}
                  />
                </div>
              );
            }

            if (field.code === 'payment_date') {
              return (
                <div key={field.code}>
                  <Label>{field.label}</Label>
                  <Input
                    type="datetime-local"
                    value={
                      form.paymentDate
                        ? new Date(form.paymentDate).toISOString().slice(0, 16)
                        : new Date().toISOString().slice(0, 16)
                    }
                    onChange={(e) => updateField('paymentDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                    disabled={!editable}
                  />
                </div>
              );
            }

            if (field.code === 'notes') {
              return (
                <div key={field.code} className="md:col-span-2">
                  <Label>{field.label}</Label>
                  <Textarea
                    value={form.notes || ''}
                    onChange={(e) => updateField('notes', e.target.value || null)}
                    disabled={!editable}
                    rows={3}
                  />
                </div>
              );
            }

            return null;
          })}
        </div>
      )}

      {visibleCustomFields.length > 0 && (
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-medium mb-4">Custom Fields</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleCustomFields.map((field) => {
              const editable = isFieldEditable('payment_management', field.code);
              const value = form.customFields?.[field.code];

              if (field.fieldType === 'text' || field.fieldType === 'email' || field.fieldType === 'url') {
                return (
                  <div key={field.code}>
                    <Label>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Input
                      type={field.fieldType === 'email' ? 'email' : field.fieldType === 'url' ? 'url' : 'text'}
                      value={(value as string) || ''}
                      onChange={(e) => updateCustomField(field.code, e.target.value)}
                      disabled={!editable}
                      required={field.required}
                    />
                  </div>
                );
              }

              if (field.fieldType === 'number') {
                return (
                  <div key={field.code}>
                    <Label>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Input
                      type="number"
                      value={(value as number) || ''}
                      onChange={(e) => updateCustomField(field.code, parseFloat(e.target.value) || 0)}
                      disabled={!editable}
                      required={field.required}
                    />
                  </div>
                );
              }

              if (field.fieldType === 'boolean') {
                return (
                  <div key={field.code} className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      checked={(value as boolean) || false}
                      onCheckedChange={(checked) => updateCustomField(field.code, checked)}
                      disabled={!editable}
                    />
                    <Label>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                  </div>
                );
              }

              if (field.fieldType === 'textarea') {
                return (
                  <div key={field.code} className="md:col-span-2">
                    <Label>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Textarea
                      value={(value as string) || ''}
                      onChange={(e) => updateCustomField(field.code, e.target.value)}
                      disabled={!editable}
                      required={field.required}
                      rows={3}
                    />
                  </div>
                );
              }

              if (field.fieldType === 'date' || field.fieldType === 'datetime') {
                return (
                  <div key={field.code}>
                    <Label>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Input
                      type={field.fieldType === 'datetime' ? 'datetime-local' : 'date'}
                      value={
                        value
                          ? field.fieldType === 'datetime'
                            ? new Date(value as string).toISOString().slice(0, 16)
                            : new Date(value as string).toISOString().slice(0, 10)
                          : ''
                      }
                      onChange={(e) =>
                        updateCustomField(
                          field.code,
                          e.target.value ? new Date(e.target.value).toISOString() : null,
                        )
                      }
                      disabled={!editable}
                      required={field.required}
                    />
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

