'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, RefreshCw, Upload, X, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/core/store/authStore';
import { useCustomFieldsStore } from '@/core/store/customFieldsStore';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Select } from '@/core/components/ui/select';
import { Switch } from '@/core/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';
import type { CustomFieldType, CustomFieldMetadata } from '@/core/lib/services/customFieldsService';

interface CustomField {
  id: string;
  moduleId: string;
  name: string;
  code: string;
  label: string;
  fieldType: CustomFieldType;
  description?: string | null;
  metadata?: CustomFieldMetadata;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface ModuleWithFields {
  id: string;
  name: string;
  code: string;
  fields: CustomField[];
  fieldCount: number;
}

const FIELD_TYPES: Array<{ value: CustomFieldType; label: string }> = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'url', label: 'URL' },
];

export default function CustomFieldsSettingsPage() {
  const { accessToken } = useAuthStore();
  const { invalidateCache } = useCustomFieldsStore();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<ModuleWithFields[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    moduleId: '',
    name: '',
    code: '',
    label: '',
    fieldType: 'text' as CustomFieldType,
    isRequired: false,
    showInTable: false,
    options: '', // For select fields, comma-separated
  });

  const loadModules = async () => {
    setLoading(true);
    try {
      if (!accessToken) {
        // No token → nothing to load; show empty state instead of infinite spinner
        setModules([]);
        return;
      }

      const res = await fetch('/api/settings/custom-fields', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load custom fields');
      }

      const data = await res.json();
      if (data.success) {
        setModules(data.data);
        if (data.data.length > 0 && !selectedModule) {
          setSelectedModule(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Load modules error:', error);
      toast.error('Failed to load custom fields');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for auth store hydration; once we have a token (or know there is none), load modules
    loadModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const loadFieldsForModule = async (moduleId: string) => {
    if (!accessToken || !moduleId) return;

    try {
      const res = await fetch(`/api/settings/custom-fields?moduleId=${moduleId}&search=${encodeURIComponent(searchTerm)}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load fields');
      }

      const data = await res.json();
      if (data.success) {
        // Update the fields for this module
        setModules(prev =>
          prev.map(m =>
            m.id === moduleId ? { ...m, fields: data.data, fieldCount: data.data.length } : m
          )
        );
      }
    } catch (error) {
      console.error('Load fields error:', error);
      toast.error('Failed to load fields');
    }
  };

  useEffect(() => {
    if (selectedModule) {
      loadFieldsForModule(selectedModule);
    }
  }, [selectedModule, searchTerm]);

  const currentModule = modules.find(m => m.id === selectedModule);
  const currentFields = currentModule?.fields || [];

  const resetForm = () => {
    // Auto-select first eligible module if available
    const defaultModuleId = modules.length > 0 ? modules[0].id : '';
    setForm({
      moduleId: defaultModuleId,
      name: '',
      code: '',
      label: '',
      fieldType: 'text',
      isRequired: false,
      showInTable: false,
      options: '',
    });
    setEditingField(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (field: CustomField) => {
    setEditingField(field);
    setForm({
      moduleId: field.moduleId,
      name: field.name,
      code: field.code,
      label: field.label,
      fieldType: field.fieldType,
      isRequired: field.metadata?.isRequired || false,
      showInTable: field.metadata?.showInTable || false,
      options: field.metadata?.options?.join(', ') || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (fieldId: string) => {
    if (!accessToken) return;
    if (!confirm('Are you sure you want to delete this custom field? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/settings/custom-fields/${fieldId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete field');
      }

      toast.success('Custom field deleted successfully');

      // Invalidate cache for the active module
      if (selectedModule) {
        invalidateCache(selectedModule);
      }

      loadFieldsForModule(selectedModule);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete custom field');
    }
  };

  const handleSave = async () => {
    if (!accessToken) {
      toast.error('You must be logged in');
      return;
    }

    if (!form.moduleId || !form.name || !form.fieldType) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Auto-generate code from name
    const code = form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    // Auto-generate label from name
    const label = form.name.trim();

    // Validate field code format
    if (!/^[a-zA-Z0-9_]+$/.test(code)) {
      toast.error('Field name contains invalid characters. Please use only letters, numbers, and spaces.');
      return;
    }

    setSaving(true);
    try {
      const metadata: CustomFieldMetadata = {
        isRequired: form.isRequired,
        showInTable: form.showInTable,
      };

      // Add options for select fields
      if (form.fieldType === 'select' && form.options) {
        metadata.options = form.options.split(',').map(o => o.trim()).filter(Boolean);
      }

      const payload: any = {
        moduleId: form.moduleId,
        name: form.name.trim(),
        code: code.trim(),
        label: label,
        fieldType: form.fieldType,
        metadata,
      };

      const url = editingField
        ? `/api/settings/custom-fields/${editingField.id}`
        : '/api/settings/custom-fields';
      const method = editingField ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to save custom field');
      }

      toast.success(editingField ? 'Custom field updated successfully' : 'Custom field created successfully');

      // Invalidate cache for the affected module
      const cacheTarget = form.moduleId || selectedModule;
      if (cacheTarget) {
        invalidateCache(cacheTarget);
      }

      setDialogOpen(false);
      resetForm();
      loadFieldsForModule(selectedModule);
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save custom field');
    } finally {
      setSaving(false);
    }
  };

  const getFieldTypeLabel = (type: CustomFieldType) => {
    return FIELD_TYPES.find(t => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Custom Fields</h1>
        <p className="text-sm text-muted-foreground">
          Define additional fields to capture organization-specific information.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name or identifier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadModules}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={openCreate} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Custom Field
          </Button>
        </div>
      </div>

      {modules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No modules with custom fields enabled found.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {modules.length > 1 && (
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium">Module:</label>
              <Select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                options={modules.map(m => ({ value: m.id, label: m.name }))}
                className="w-64"
              />
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Custom Fields</CardTitle>
            </CardHeader>
            <CardContent>
              {currentFields.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No custom fields defined for this module.</p>
                  <p className="text-sm mt-2">Click "New Custom Field" to create one.</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>NAME</TableHead>
                        <TableHead>BELONGS TO</TableHead>
                        <TableHead>TYPE</TableHead>
                        <TableHead>REQUIRED</TableHead>
                        <TableHead>SHOW IN TABLE</TableHead>
                        <TableHead className="text-right">ACTIONS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentFields.map((field) => (
                        <TableRow key={field.id}>
                          <TableCell className="font-medium">{field.name}</TableCell>
                          <TableCell>{currentModule?.name || 'Unknown'}</TableCell>
                          <TableCell>{getFieldTypeLabel(field.fieldType)}</TableCell>
                          <TableCell>
                            {field.metadata?.isRequired ? (
                              <Badge variant="default" className="bg-green-500">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {field.metadata?.showInTable ? (
                              <Badge variant="default" className="bg-blue-500">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(field)}
                                className="hover:bg-accent"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(field.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingField ? 'Edit Custom Field' : 'New Custom Field'}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4">
            <div>
              <Select
                label="Belongs to"
                value={form.moduleId}
                onChange={(e) => setForm({ ...form, moduleId: e.target.value })}
                options={[
                  { value: '', label: 'Select a module' },
                  ...modules.map(m => ({ value: m.id, label: m.name })),
                ]}
                disabled={!!editingField}
              />
            </div>

            <div>
              <Input
                label="Field Name"
                placeholder="e.g., Client Email"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  // Auto-generate code and label from name
                  const autoCode = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                  setForm({
                    ...form,
                    name,
                    code: editingField ? form.code : autoCode,
                    label: name, // Always sync label with name
                  });
                }}
              />
            </div>

            <div>
              <Select
                label="Type"
                value={form.fieldType}
                onChange={(e) => setForm({ ...form, fieldType: e.target.value as CustomFieldType })}
                options={FIELD_TYPES.map(t => ({ value: t.value, label: t.label }))}
              />
            </div>

            {form.fieldType === 'select' && (
              <div>
                <Input
                  label="Options"
                  placeholder="Comma-separated values (e.g., Option 1, Option 2, Option 3)"
                  value={form.options}
                  onChange={(e) => setForm({ ...form, options: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-3">
              <Switch
                checked={form.isRequired}
                onCheckedChange={(checked) => setForm({ ...form, isRequired: checked })}
                label="Is Required?"
              />
              <Switch
                checked={form.showInTable}
                onCheckedChange={(checked) => setForm({ ...form, showInTable: checked })}
                label="Show in Table?"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingField ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
