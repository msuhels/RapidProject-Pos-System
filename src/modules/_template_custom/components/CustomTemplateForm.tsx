'use client';

import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { Select } from '@/core/components/ui/select';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import type { CreateCustomTemplateInput } from '../types';
import { useCustomTemplateCustomFields } from '../hooks/useCustomTemplateCustomFields';

interface CustomTemplateFormProps {
  form: CreateCustomTemplateInput;
  onChange: (form: CreateCustomTemplateInput) => void;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

const STANDARD_FIELD_CONFIG = [
  { code: 'name', label: 'Name', type: 'text' as const },
  { code: 'description', label: 'Description', type: 'textarea' as const },
  { code: 'status', label: 'Status', type: 'select' as const },
] as const;

export function CustomTemplateForm({ form, onChange }: CustomTemplateFormProps) {
  const { isFieldVisible, isFieldEditable, loading: loadingPerms } =
    useFieldPermissions('template_custom');
  const { customFields, loading: loadingCustomFields } = useCustomTemplateCustomFields();

  const updateField = <K extends keyof CreateCustomTemplateInput>(
    key: K,
    value: CreateCustomTemplateInput[K],
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
          {[1, 2].map((i) => (
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
    isFieldVisible('template_custom', field.code),
  );

  const visibleCustomFields = customFields.filter((field) =>
    isFieldVisible('template_custom', field.code),
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
            const value = (form as any)[field.code] ?? '';
            const editable = isFieldEditable('template_custom', field.code);

            return (
              <div key={field.code}>
                <Label>
                  {field.label}
                  {!editable && (
                    <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                  )}
                </Label>

                {field.type === 'textarea' && (
                  <Textarea
                    value={value}
                    onChange={(e) =>
                      updateField(field.code as keyof CreateCustomTemplateInput, e.target.value)
                    }
                    disabled={!editable}
                    rows={3}
                  />
                )}

                {field.type === 'text' && (
                  <Input
                    value={value}
                    onChange={(e) =>
                      updateField(field.code as keyof CreateCustomTemplateInput, e.target.value)
                    }
                    disabled={!editable}
                  />
                )}

                {field.type === 'select' && (
                  <Select
                    value={value || 'active'}
                    onChange={(e) =>
                      updateField(field.code as keyof CreateCustomTemplateInput, e.target.value)
                    }
                    options={STATUS_OPTIONS}
                    disabled={!editable}
                    className="w-full"
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
                const editable = isFieldEditable('template_custom', field.code);

                return (
                  <div key={field.id}>
                    <Label>
                      {field.label}
                      {isRequired && <span className="text-destructive ml-1">*</span>}
                      {!editable && (
                        <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                      )}
                    </Label>

                    <Input
                      value={value as string}
                      onChange={(e) => updateCustomField(field.code, e.target.value)}
                      disabled={!editable}
                      required={isRequired}
                    />

                    {field.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {field.description}
                      </p>
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


