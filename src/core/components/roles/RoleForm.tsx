'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Select } from '@/core/components/ui/select';
import { Button } from '@/core/components/ui/button';
import { Shield, Tag, FileText, TrendingUp, Activity } from 'lucide-react';
import {
  createRoleSchema,
  updateRoleSchema,
  type CreateRoleInput,
  type UpdateRoleInput,
} from '@/core/lib/validations/roles';
import type { Role } from '@/core/lib/db/baseSchema';

interface RoleFormProps {
  initialData?: Role;
  onSubmit: (data: CreateRoleInput | UpdateRoleInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

type RoleFormState = {
  name: string;
  code: string;
  description: string;
  priority: number;
  status: 'active' | 'inactive';
};

export function RoleForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: RoleFormProps) {
  const [formData, setFormData] = useState<RoleFormState>({
    name: initialData?.name ?? '',
    code: initialData?.code ?? '',
    description: initialData?.description ?? '',
    priority: initialData?.priority ?? 0,
    status: (initialData?.status as 'active' | 'inactive') ?? 'active',
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name ?? '',
        code: initialData.code ?? '',
        description: initialData.description ?? '',
        priority: initialData.priority ?? 0,
        status: (initialData.status as 'active' | 'inactive') ?? 'active',
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'priority' ? parseInt(value) || 0 : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const schema = initialData ? updateRoleSchema : createRoleSchema;
    const result = schema.safeParse(formData);

    if (!result.success) {
      const newErrors: Partial<Record<string, string>> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          newErrors[error.path[0] as string] = error.message;
        }
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData as CreateRoleInput | UpdateRoleInput);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative">
            <Tag className="absolute left-3 top-[2.6rem] h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="name"
              name="name"
              label="Role Name"
              required
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="e.g., Project Manager"
              className="pl-10"
            />
          </div>

          <div className="relative">
            <Tag className="absolute left-3 top-[2.6rem] h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="code"
              name="code"
              label="Role Code"
              required
              value={formData.code}
              onChange={handleChange}
              error={errors.code}
              placeholder="PROJECT_MANAGER"
              disabled={!!initialData?.isSystem}
              helperText={initialData?.isSystem ? "System roles cannot be modified" : "Uppercase letters and underscores only"}
              className="pl-10 disabled:bg-muted/50"
            />
          </div>
        </div>

        <div className="relative">
          <FileText className="absolute left-3 top-[2.6rem] h-4 w-4 text-muted-foreground pointer-events-none" />
          <Textarea
            id="description"
            name="description"
            label="Description"
            value={formData.description}
            onChange={handleChange}
            error={errors.description}
            placeholder="Describe the role's responsibilities and purpose..."
            rows={4}
            className="pl-10"
          />
        </div>
      </div>

      {/* Configuration Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Configuration</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {!initialData && (
            <div className="relative">
              <TrendingUp className="absolute left-3 top-[2.6rem] h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="priority"
                name="priority"
                label="Priority Level"
                type="number"
                min="0"
                max="100"
                value={formData.priority?.toString() || '0'}
                onChange={handleChange}
                error={errors.priority}
                helperText="Higher priority = more permissions in conflicts (0-100)"
                className="pl-10"
              />
            </div>
          )}

          <Select
            id="status"
            name="status"
            label="Role Status"
            value={formData.status || 'active'}
            onChange={handleChange}
            error={errors.status}
            options={[
              { value: 'active', label: '✓ Active' },
              { value: 'inactive', label: '○ Inactive' },
            ]}
          />
        </div>
      </div>

      {/* System Role Warning */}
      {initialData?.isSystem && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-4">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">System Role</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                This is a system role with protected settings. Some fields cannot be modified to maintain system integrity.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-6 border-t border-border">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto min-w-[100px]"
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="w-full sm:w-auto min-w-[140px] font-medium"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {initialData ? '✓ Update Role' : '+ Create Role'}
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}

