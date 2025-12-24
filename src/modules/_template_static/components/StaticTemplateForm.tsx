'use client';

import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { Select } from '@/core/components/ui/select';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import type { CreateStaticTemplateInput } from '../types';

interface StaticTemplateFormProps {
  form: CreateStaticTemplateInput;
  onChange: (form: CreateStaticTemplateInput) => void;
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

export function StaticTemplateForm({ form, onChange }: StaticTemplateFormProps) {
  const { isFieldVisible, isFieldEditable, loading } = useFieldPermissions('template_static');

  const updateField = <K extends keyof CreateStaticTemplateInput>(
    key: K,
    value: CreateStaticTemplateInput[K],
  ) => {
    onChange({ ...form, [key]: value });
  };

  if (loading) {
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

  const visibleFields = STANDARD_FIELD_CONFIG.filter((field) =>
    isFieldVisible('template_static', field.code),
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
          const editable = isFieldEditable('template_static', field.code);

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
                    updateField(field.code as keyof CreateStaticTemplateInput, e.target.value)
                  }
                  disabled={!editable}
                  rows={3}
                />
              )}

              {field.type === 'text' && (
                <Input
                  value={value}
                  onChange={(e) =>
                    updateField(field.code as keyof CreateStaticTemplateInput, e.target.value)
                  }
                  disabled={!editable}
                />
              )}

              {field.type === 'select' && (
                <Select
                  value={value || 'active'}
                  onChange={(e) =>
                    updateField(field.code as keyof CreateStaticTemplateInput, e.target.value)
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
    </div>
  );
}


