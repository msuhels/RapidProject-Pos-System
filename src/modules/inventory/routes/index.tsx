'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { Plus, RefreshCcw, Download, Upload, Tag, X } from 'lucide-react';
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
import type { Product } from '../types';
import { InventoryForm } from '../components/InventoryForm';
import { InventoryTable } from '../components/InventoryTable';
import { InventoryLabelsDialog } from '../components/InventoryLabelsDialog';
import { useInventoryLabels } from '../hooks/useInventoryLabels';

const defaultForm = {
  sku: '',
  location: '',
  quantity: '',
  status: 'in_stock',
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [location, setLocation] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [labelsDialogOpen, setLabelsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { hasPermission } = usePermissions();
  const debouncedSearch = useDebounce(search, 500);
  const { labels } = useInventoryLabels();

  const canUpdate = hasPermission('inventory:update') || hasPermission('inventory:*');
  const canDelete = hasPermission('inventory:delete') || hasPermission('inventory:*');
  const canExport = hasPermission('inventory:export') || hasPermission('inventory:*');
  const canImport = hasPermission('inventory:import') || hasPermission('inventory:*');
  const canDuplicate = hasPermission('inventory:duplicate') || hasPermission('inventory:*');
  const canManageLabels = hasPermission('inventory:manage_labels') || hasPermission('inventory:*');

  const showActions = canUpdate || canDelete || canDuplicate;

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (status !== 'all') params.set('status', status);
      if (location !== 'all') params.set('location', location);

      const query = params.toString();
      const url = query ? `/api/inventory?${query}` : '/api/inventory';

      const res = await fetch(url);
      const json = await res.json();

      if (res.ok && json.success) {
        setInventory(json.data ?? []);
      } else {
        toast.error(json.error || 'Failed to load inventory');
      }
    } catch (error) {
      console.error('Inventory fetch error:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, location]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const openEdit = (item: Product) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update inventory');
      return;
    }
    setEditingId(item.id);
    setForm({
      sku: item.sku || '',
      location: item.location || '',
      quantity: item.quantity,
      status: item.status || 'in_stock',
    });
    setDialogOpen(true);
  };

  const saveInventory = async () => {
    if (!canUpdate) {
      toast.error('You do not have permission to update inventory');
      return;
    }

    if (!form.quantity.trim()) {
      toast.error('Quantity is required');
      return;
    }

    if (!editingId) {
      toast.error('Product ID is required');
      return;
    }

    setSaving(true);
    try {
      const url = `/api/inventory/${editingId}`;

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update inventory');
      }

      setDialogOpen(false);
      resetForm();
      fetchInventory();
      toast.success('Inventory updated');
    } catch (error) {
      console.error('Inventory save error:', error);
      const message = error instanceof Error ? error.message : 'Failed to update inventory';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteInventory = async (item: Product) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete inventory');
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/inventory/${item.id}`, { method: 'DELETE' });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to delete product');
        }
        await fetchInventory();
      })(),
      {
        loading: 'Deleting product...',
        success: 'Product deleted successfully',
        error: (err) => (err instanceof Error ? err.message : 'Failed to delete product'),
      },
    );
  };

  const duplicateInventory = async (item: Product) => {
    if (!canDuplicate) {
      toast.error('You do not have permission to duplicate inventory');
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/inventory/${item.id}/duplicate`, { method: 'POST' });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to duplicate product');
        }
        await fetchInventory();
      })(),
      {
        loading: 'Duplicating product...',
        success: 'Product duplicated successfully',
        error: (err) => (err instanceof Error ? err.message : 'Failed to duplicate product'),
      },
    );
  };

  const handleExport = async () => {
    if (!canExport) {
      toast.error('You do not have permission to export inventory');
      return;
    }

    try {
      const res = await fetch('/api/inventory/export');
      if (!res.ok) {
        throw new Error('Failed to export inventory');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Inventory exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export inventory');
    }
  };

  const handleImport = async () => {
    if (!canImport) {
      toast.error('You do not have permission to import inventory');
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());
      if (lines.length < 2) {
        toast.error('Invalid CSV file');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header.toLowerCase().replace(/\s+/g, '')] = values[index] || '';
        });
        return obj;
      });

      const res = await fetch('/api/inventory/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory: rows }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to import inventory');
      }

      toast.success(`Imported ${json.data.success} inventory items successfully`);
      if (json.data.failed > 0) {
        toast.warning(`${json.data.failed} items failed to import`);
      }
      fetchInventory();
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import inventory');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' },
  ];

  const locationOptions = [
    { value: 'all', label: 'All locations' },
    { value: 'warehouse_a', label: 'Warehouse A' },
    { value: 'warehouse_b', label: 'Warehouse B' },
    { value: 'store_front', label: 'Store Front' },
  ];

  const selectedLabels = labels.filter((label) =>
    inventory.some((item) => item.labelIds?.includes(label.id)),
  );

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setLocation('all');
  };

  const hasActiveFilters = search || status !== 'all' || location !== 'all';

  return (
    <ProtectedPage permission="inventory:read" title="Inventory" description="Manage inventory for your products">
      <div className="w-full px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-2xl font-bold">Inventory</CardTitle>
            <div className="flex gap-2">
              {canExport && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              {canImport && (
                <Button variant="outline" size="sm" onClick={handleImport}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              )}
              {canManageLabels && (
                <Button variant="outline" size="sm" onClick={() => setLabelsDialogOpen(true)}>
                  <Tag className="h-4 w-4 mr-2" />
                  Manage Labels
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={fetchInventory}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1 max-w-md">
                  <Input
                    placeholder="Search by product name, SKU, or location"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={statusOptions}
                  className="w-[160px]"
                />
                <Select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  options={locationOptions}
                  className="w-[160px]"
                />
              </div>
            </div>

            {selectedLabels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedLabels.map((label) => (
                  <button
                    key={label.id}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border"
                    style={{ borderColor: label.color }}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <InventoryTable
                inventory={inventory}
                onEdit={canUpdate ? openEdit : undefined}
                onDelete={canDelete ? deleteInventory : undefined}
                onDuplicate={canDuplicate ? duplicateInventory : undefined}
                showActions={showActions}
              />
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Update Inventory</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4">
              <InventoryForm form={form} onChange={setForm} labels={labels} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveInventory} disabled={saving}>
                {saving ? 'Saving...' : 'Update'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <InventoryLabelsDialog open={labelsDialogOpen} onOpenChange={setLabelsDialogOpen} />

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </ProtectedPage>
  );
}
