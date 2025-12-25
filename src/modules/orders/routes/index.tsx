'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { Plus, RefreshCcw, Download, Upload, Tag, X } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';
import { usePermissions } from '@/core/hooks/usePermissions';
import { useDebounce } from '@/core/hooks/useDebounce';
import { useAuthStore } from '@/core/store/authStore';
import type { Order, CreateOrderInput } from '../types';
import { OrderForm } from '../components/OrderForm';
import { OrderTable } from '../components/OrderTable';
import { OrderLabelsDialog } from '../components/OrderLabelsDialog';
import { useOrderLabels } from '../hooks/useOrderLabels';

const defaultForm: CreateOrderInput = {
  userId: '',
  products: [],
  labelIds: [],
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [labelsDialogOpen, setLabelsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateOrderInput>(defaultForm);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { hasPermission } = usePermissions();
  const { user } = useAuthStore();
  const debouncedSearch = useDebounce(search, 500);
  const { labels } = useOrderLabels();

  const canCreate = hasPermission('orders:create') || hasPermission('orders:*');
  const canUpdate = hasPermission('orders:update') || hasPermission('orders:*');
  const canDelete = hasPermission('orders:delete') || hasPermission('orders:*');
  const canExport = hasPermission('orders:export') || hasPermission('orders:*');
  const canImport = hasPermission('orders:import') || hasPermission('orders:*');
  const canDuplicate = hasPermission('orders:duplicate') || hasPermission('orders:*');
  const canManageLabels = hasPermission('orders:manage_labels') || hasPermission('orders:*');

  const showActions = canUpdate || canDelete || canDuplicate;

  const fetchOrders = useCallback(async () => {
    if (!user?.id) {
      setOrders([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const query = params.toString();
      const url = query ? `/api/orders?${query}` : '/api/orders';

      const res = await fetch(url);
      const json = await res.json();

      if (res.ok && json.success) {
        setOrders(json.data ?? []);
      } else {
        toast.error(json.error || 'Failed to load orders');
      }
    } catch (error) {
      console.error('Orders fetch error:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, dateFrom, dateTo, user?.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const openCreate = () => {
    if (!canCreate) {
      toast.error('You do not have permission to create orders');
      return;
    }
    resetForm();
    if (user?.id) {
      setForm({ ...defaultForm, userId: user.id });
    }
    setDialogOpen(true);
  };

  const openEdit = (order: Order) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update orders');
      return;
    }
    setEditingId(order.id);
    setForm({
      userId: order.userId,
      orderDate: order.orderDate.split('T')[0],
      products: order.products,
      labelIds: order.labelIds || [],
    });
    setDialogOpen(true);
  };

  const saveOrder = async () => {
    if (editingId && !canUpdate) {
      toast.error('You do not have permission to update orders');
      return;
    }
    if (!editingId && !canCreate) {
      toast.error('You do not have permission to create orders');
      return;
    }

    if (!form.userId.trim()) {
      toast.error('User ID is required');
      return;
    }
    if (!form.products || form.products.length === 0) {
      toast.error('At least one product is required');
      return;
    }
    if (!user?.id) {
      toast.error('You must be logged in to save an order');
      return;
    }

    // Ensure userId is set to current user
    const formData = { ...form, userId: user.id };

    setSaving(true);
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/orders/${editingId}` : '/api/orders';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save order');
      }

      setDialogOpen(false);
      resetForm();
      fetchOrders();
      toast.success(editingId ? 'Order updated' : 'Order created');
    } catch (error) {
      console.error('Order save error:', error);
      const message = error instanceof Error ? error.message : 'Failed to save order';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteOrder = async (order: Order) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete orders');
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to delete order');
        }
        await fetchOrders();
      })(),
      {
        loading: 'Deleting order...',
        success: 'Order deleted successfully',
        error: (err) => (err instanceof Error ? err.message : 'Failed to delete order'),
      },
    );
  };

  const duplicateOrder = async (order: Order) => {
    if (!canDuplicate) {
      toast.error('You do not have permission to duplicate orders');
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/orders/${order.id}/duplicate`, { method: 'POST' });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to duplicate order');
        }
        await fetchOrders();
      })(),
      {
        loading: 'Duplicating order...',
        success: 'Order duplicated successfully',
        error: (err) => (err instanceof Error ? err.message : 'Failed to duplicate order'),
      },
    );
  };

  const handleExport = async () => {
    if (!canExport) {
      toast.error('You do not have permission to export orders');
      return;
    }

    try {
      const res = await fetch('/api/orders/export');
      if (!res.ok) {
        throw new Error('Failed to export orders');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Orders exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export orders');
    }
  };

  const handleImport = async (file: File) => {
    if (!canImport) {
      toast.error('You do not have permission to import orders');
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV file must have headers and at least one row');
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header.toLowerCase().replace(/\s+/g, '')] = values[index] || '';
        });
        return row;
      });

      const ordersData = rows.map((row) => ({
        userId: row.userid || user?.id || '',
        orderDate: row.orderdate || new Date().toISOString(),
        products: row.products ? JSON.parse(row.products) : [],
      }));

      const res = await fetch('/api/orders/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: ordersData }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to import orders');
      }

      toast.success(`Imported ${json.data.success} order(s) successfully`);
      if (json.data.failed > 0) {
        toast.warning(`${json.data.failed} order(s) failed to import`);
      }
      fetchOrders();
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import orders');
    }
  };

  const toggleLabel = (labelId: string) => {
    const currentIds = form.labelIds || [];
    if (currentIds.includes(labelId)) {
      setForm({ ...form, labelIds: currentIds.filter((id) => id !== labelId) });
    } else {
      setForm({ ...form, labelIds: [...currentIds, labelId] });
    }
  };

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = search || dateFrom || dateTo;

  return (
    <ProtectedPage permission="orders:read" title="Order History" description="Manage customer orders">
      <div className="w-full px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-2xl font-bold">Order History</CardTitle>
            <div className="flex gap-2">
              {canManageLabels && (
                <Button variant="outline" size="sm" onClick={() => setLabelsDialogOpen(true)}>
                  <Tag className="h-4 w-4 mr-2" />
                  Manage Labels
                </Button>
              )}
              {canExport && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              {canImport && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImport(file);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </>
              )}
              {canCreate && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Order
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={fetchOrders}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1 max-w-md">
                  <Input
                    placeholder="Search orders..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="From Date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-[150px]"
                  />
                  <Input
                    type="date"
                    placeholder="To Date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-[150px]"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <OrderTable
                orders={orders}
                onEdit={canUpdate ? openEdit : undefined}
                onDelete={canDelete ? deleteOrder : undefined}
                onDuplicate={canDuplicate ? duplicateOrder : undefined}
                showActions={showActions}
              />
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Order' : 'New Order'}</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4 space-y-4">
              <OrderForm form={form} onChange={setForm} />
              {labels.length > 0 && (
                <div className="space-y-2">
                  <Label>Labels</Label>
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label) => {
                      const isSelected = form.labelIds?.includes(label.id);
                      return (
                        <button
                          key={label.id}
                          type="button"
                          onClick={() => toggleLabel(label.id)}
                          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-border hover:bg-accent'
                          }`}
                          style={isSelected ? { borderColor: label.color } : {}}
                        >
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: label.color }}
                          />
                          {label.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveOrder} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <OrderLabelsDialog open={labelsDialogOpen} onOpenChange={setLabelsDialogOpen} />
      </div>
    </ProtectedPage>
  );
}

