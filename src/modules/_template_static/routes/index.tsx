'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { Select } from '@/core/components/ui/select';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';
import { usePermissions } from '@/core/hooks/usePermissions';
import { useDebounce } from '@/core/hooks/useDebounce';
import type { StaticTemplateRecord, CreateStaticTemplateInput } from '../types';
import { StaticTemplateForm } from '../components/StaticTemplateForm';
import { StaticTemplateTable } from '../components/StaticTemplateTable';

const defaultForm: CreateStaticTemplateInput = {
  name: '',
  description: '',
  status: 'active',
};

export default function StaticTemplatePage() {
  const [records, setRecords] = useState<StaticTemplateRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateStaticTemplateInput>(defaultForm);
  const [saving, setSaving] = useState(false);

  const { hasPermission } = usePermissions();
  const debouncedSearch = useDebounce(search, 300);

  const canCreate = hasPermission('template_static:create') || hasPermission('template_static:*');
  const canUpdate = hasPermission('template_static:update') || hasPermission('template_static:*');
  const canDelete = hasPermission('template_static:delete') || hasPermission('template_static:*');

  const showActions = canUpdate || canDelete;

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (status !== 'all') params.set('status', status);

      const query = params.toString();
      const url = query ? `/api/_templates/static?${query}` : '/api/_templates/static';

      const res = await fetch(url);
      const json = await res.json();

      if (res.ok && json.success) {
        setRecords(json.data ?? []);
      } else {
        toast.error(json.error || 'Failed to load records');
      }
    } catch (error) {
      console.error('Static template fetch error:', error);
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const openCreate = () => {
    if (!canCreate) {
      toast.error('You do not have permission to create records');
      return;
    }
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (record: StaticTemplateRecord) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update records');
      return;
    }
    setEditingId(record.id);
    setForm({
      name: record.name,
      description: record.description ?? '',
      status: record.status,
    });
    setDialogOpen(true);
  };

  const saveRecord = async () => {
    if (editingId && !canUpdate) {
      toast.error('You do not have permission to update records');
      return;
    }
    if (!editingId && !canCreate) {
      toast.error('You do not have permission to create records');
      return;
    }

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId
        ? `/api/_templates/static/${editingId}`
        : '/api/_templates/static';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, name: trimmedName }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save record');
      }

      setDialogOpen(false);
      resetForm();
      fetchRecords();
      toast.success(editingId ? 'Record updated' : 'Record created');
    } catch (error) {
      console.error('Static template save error:', error);
      const message = error instanceof Error ? error.message : 'Failed to save record';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (record: StaticTemplateRecord) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete records');
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/_templates/static/${record.id}`, { method: 'DELETE' });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to delete record');
        }
        await fetchRecords();
      })(),
      {
        loading: 'Deleting record...',
        success: 'Record deleted successfully',
        error: (err) => (err instanceof Error ? err.message : 'Failed to delete record'),
      },
    );
  };

  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'archived', label: 'Archived' },
  ];

  return (
    <ProtectedPage
      permission="template_static:read"
      title="Static Module Template"
      description="REFERENCE ONLY – blueprint for non-custom-fields modules"
    >
      <div className="w-full px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-2xl font-bold">Static Module Template</CardTitle>
            <div className="flex gap-2">
              {canCreate && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add record
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={fetchRecords}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1 max-w-md">
                  <Input
                    placeholder="Search by name or description"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={statusOptions}
                  className="w-[160px]"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <StaticTemplateTable
                records={records}
                onEdit={canUpdate ? openEdit : undefined}
                onDelete={canDelete ? deleteRecord : undefined}
                showActions={showActions}
              />
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit record' : 'New record'}</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4">
              <StaticTemplateForm form={form} onChange={setForm} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveRecord} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedPage>
  );
}


