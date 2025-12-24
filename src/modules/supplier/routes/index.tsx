'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCcw, X } from 'lucide-react';
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
import type { SupplierRecord, CreateSupplierInput } from '../types';
import { SupplierForm } from '../components/SupplierForm';
import { SupplierTable } from '../components/SupplierTable';

const defaultForm: CreateSupplierInput = {
  supplierCode: '',
  supplierName: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  status: 'active',
  customFields: {},
};

export default function SuppliersPage() {
  const [records, setRecords] = useState<SupplierRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<SupplierRecord | null>(null);
  const [form, setForm] = useState<CreateSupplierInput>(defaultForm);
  const [saving, setSaving] = useState(false);

  const { hasPermission } = usePermissions();
  const debouncedSearch = useDebounce(search, 500);

  const canCreate = hasPermission('supplier:create') || hasPermission('supplier:*');
  const canUpdate = hasPermission('supplier:update') || hasPermission('supplier:*');
  const canDelete = hasPermission('supplier:delete') || hasPermission('supplier:*');

  const showActions = canUpdate || canDelete;

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const query = params.toString();
      const url = query ? `/api/suppliers?${query}` : '/api/suppliers';

      const res = await fetch(url);
      const json = await res.json();

      if (res.ok && json.success) {
        setRecords(json.data ?? []);
      } else {
        toast.error(json.error || 'Failed to load suppliers');
      }
    } catch (error) {
      console.error('Supplier fetch error:', error);
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const openCreate = () => {
    if (!canCreate) {
      toast.error('You do not have permission to create suppliers');
      return;
    }
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (record: SupplierRecord) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update suppliers');
      return;
    }
    setEditingId(record.id);
    setForm({
      supplierCode: record.supplierCode,
      supplierName: record.supplierName,
      contactPerson: record.contactPerson ?? '',
      email: record.email ?? '',
      phone: record.phone ?? '',
      address: record.address ?? '',
      status: record.status,
      customFields: record.customFields ?? {},
    });
    setDialogOpen(true);
  };

  const saveRecord = async () => {
    if (editingId && !canUpdate) {
      toast.error('You do not have permission to update suppliers');
      return;
    }
    if (!editingId && !canCreate) {
      toast.error('You do not have permission to create suppliers');
      return;
    }

    const trimmedCode = form.supplierCode.trim();
    const trimmedName = form.supplierName.trim();
    if (!trimmedCode || !trimmedName) {
      toast.error('Supplier code and name are required');
      return;
    }

    setSaving(true);
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/suppliers/${editingId}` : '/api/suppliers';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, supplierCode: trimmedCode, supplierName: trimmedName }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save supplier');
      }

      setDialogOpen(false);
      resetForm();
      fetchRecords();
      toast.success(editingId ? 'Supplier updated' : 'Supplier created');
    } catch (error) {
      console.error('Supplier save error:', error);
      const message = error instanceof Error ? error.message : 'Failed to save supplier';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (record: SupplierRecord) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete suppliers');
      return;
    }
    setDeletingRecord(record);
    setDeleteDialogOpen(true);
  };

  const deleteRecord = async () => {
    if (!deletingRecord) return;

    toast.promise(
      (async () => {
        const res = await fetch(`/api/suppliers/${deletingRecord.id}`, { method: 'DELETE' });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to delete supplier');
        }
        await fetchRecords();
        setDeleteDialogOpen(false);
        setDeletingRecord(null);
      })(),
      {
        loading: 'Deleting supplier...',
        success: 'Supplier deleted successfully',
        error: (err) => (err instanceof Error ? err.message : 'Failed to delete supplier'),
      },
    );
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  const hasActiveFilters = search || statusFilter !== 'all';

  return (
    <ProtectedPage
      permission="supplier:read"
      title="Suppliers"
      description="Maintain supplier information for inventory sourcing and procurement workflows"
    >
      <div className="w-full px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-2xl font-bold">Suppliers</CardTitle>
            <div className="flex gap-2">
              {canCreate && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
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
                    placeholder="Search by supplier code, name, email, or phone"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear filters
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All statuses' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                  className="w-[140px]"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <SupplierTable
                records={records}
                onEdit={canUpdate ? openEdit : undefined}
                onDelete={canDelete ? openDelete : undefined}
                showActions={showActions}
              />
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Supplier' : 'New Supplier'}</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4">
              <SupplierForm form={form} onChange={setForm} />
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

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Supplier</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this supplier? This action cannot be undone.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={deleteRecord}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedPage>
  );
}

