'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { Plus, RefreshCcw, Download, Upload, Tag, X, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { Select } from '@/core/components/ui/select';
import { Label } from '@/core/components/ui/label';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';
import { usePermissions } from '@/core/hooks/usePermissions';
import { useDebounce } from '@/core/hooks/useDebounce';
import { useAuthStore } from '@/core/store/authStore';
import type { Cart, CreateCartInput } from '../types';
import { CartForm } from '../components/CartForm';
import { CartTable } from '../components/CartTable';
import { CartLabelsDialog } from '../components/CartLabelsDialog';
import { useCartLabels } from '../hooks/useCartLabels';

const defaultForm: CreateCartInput = {
  productId: '',
  quantity: '',
  userId: '',
  labelIds: [],
};

export default function CartsPage() {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [productIdFilter, setProductIdFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [labelsDialogOpen, setLabelsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateCartInput>(defaultForm);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { hasPermission } = usePermissions();
  const { user } = useAuthStore();
  const debouncedSearch = useDebounce(search, 500);
  const { labels } = useCartLabels();

  const canCreate = hasPermission('carts:create') || hasPermission('carts:*');
  const canUpdate = hasPermission('carts:update') || hasPermission('carts:*');
  const canDelete = hasPermission('carts:delete') || hasPermission('carts:*');
  const canExport = hasPermission('carts:export') || hasPermission('carts:*');
  const canImport = hasPermission('carts:import') || hasPermission('carts:*');
  const canDuplicate = hasPermission('carts:duplicate') || hasPermission('carts:*');
  const canManageLabels = hasPermission('carts:manage_labels') || hasPermission('carts:*');
  // Checkout button will be visible when there are items - permission check happens on backend

  const showActions = canUpdate || canDelete || canDuplicate;

  const fetchCarts = useCallback(async () => {
    if (!user?.id) {
      setCarts([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (productIdFilter !== 'all') params.set('productId', productIdFilter);

      const query = params.toString();
      const url = query ? `/api/carts?${query}` : '/api/carts';

      const res = await fetch(url);
      const json = await res.json();

      if (res.ok && json.success) {
        setCarts(json.data ?? []);
      } else {
        toast.error(json.error || 'Failed to load carts');
      }
    } catch (error) {
      console.error('Carts fetch error:', error);
      toast.error('Failed to load carts');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, productIdFilter, user?.id]);

  useEffect(() => {
    fetchCarts();
  }, [fetchCarts]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const openCreate = () => {
    if (!canCreate) {
      toast.error('You do not have permission to create carts');
      return;
    }
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (cart: Cart) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update carts');
      return;
    }
    setEditingId(cart.id);
    setForm({
      productId: cart.productId,
      quantity: cart.quantity,
      userId: cart.userId,
      labelIds: cart.labelIds || [],
    });
    setDialogOpen(true);
  };

  const saveCart = async () => {
    if (editingId && !canUpdate) {
      toast.error('You do not have permission to update carts');
      return;
    }
    if (!editingId && !canCreate) {
      toast.error('You do not have permission to create carts');
      return;
    }

    if (!form.productId.trim()) {
      toast.error('Product ID is required');
      return;
    }
    if (!form.quantity.trim()) {
      toast.error('Quantity is required');
      return;
    }
    if (!user?.id) {
      toast.error('You must be logged in to save a cart');
      return;
    }
    
    // Ensure userId is set to current user
    const formData = { ...form, userId: user.id };

    setSaving(true);
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/carts/${editingId}` : '/api/carts';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save cart');
      }

      setDialogOpen(false);
      resetForm();
      fetchCarts();
      toast.success(editingId ? 'Cart updated' : 'Cart created');
    } catch (error) {
      console.error('Cart save error:', error);
      const message = error instanceof Error ? error.message : 'Failed to save cart';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteCart = async (cart: Cart) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete carts');
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/carts/${cart.id}`, { method: 'DELETE' });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to delete cart');
        }
        await fetchCarts();
      })(),
      {
        loading: 'Deleting cart...',
        success: 'Cart deleted successfully',
        error: (err) => (err instanceof Error ? err.message : 'Failed to delete cart'),
      },
    );
  };

  const duplicateCart = async (cart: Cart) => {
    if (!canDuplicate) {
      toast.error('You do not have permission to duplicate carts');
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/carts/${cart.id}/duplicate`, { method: 'POST' });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to duplicate cart');
        }
        await fetchCarts();
      })(),
      {
        loading: 'Duplicating cart...',
        success: 'Cart duplicated successfully',
        error: (err) => (err instanceof Error ? err.message : 'Failed to duplicate cart'),
      },
    );
  };

  const handleCheckout = async () => {
    if (carts.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch('/api/carts/checkout', { method: 'POST' });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to checkout');
        }
        await fetchCarts();
        return json.data;
      })(),
      {
        loading: 'Processing checkout...',
        success: (data) => data?.message || 'Order created successfully',
        error: (err) => (err instanceof Error ? err.message : 'Failed to checkout'),
      },
    );
  };

  const handleExport = async () => {
    if (!canExport) {
      toast.error('You do not have permission to export carts');
      return;
    }

    try {
      const res = await fetch('/api/carts/export');
      if (!res.ok) {
        throw new Error('Failed to export carts');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Carts exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export carts');
    }
  };

  const handleImport = async (file: File) => {
    if (!canImport) {
      toast.error('You do not have permission to import carts');
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

      const cartsData = rows.map((row) => ({
        productId: row.productid || '',
        quantity: row.quantity || '',
        userId: row.userid || '',
      }));

      const res = await fetch('/api/carts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carts: cartsData }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to import carts');
      }

      toast.success(`Imported ${json.data.success} cart(s) successfully`);
      if (json.data.failed > 0) {
        toast.warning(`${json.data.failed} cart(s) failed to import`);
      }
      fetchCarts();
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import carts');
    }
  };

  const productIds = Array.from(new Set(carts.map((c) => c.productId).filter(Boolean)));

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
    setProductIdFilter('all');
  };

  const hasActiveFilters = search || productIdFilter !== 'all';

  return (
    <ProtectedPage permission="carts:read" title="Carts" description="Manage user carts">
      <div className="w-full px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-2xl font-bold">Carts</CardTitle>
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
              {carts.length > 0 && (
                <Button size="sm" onClick={handleCheckout} className="bg-green-600 hover:bg-green-700 text-white">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Checkout
                </Button>
              )}
              {canCreate && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Cart
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={fetchCarts}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1 max-w-md">
                  <Input
                    placeholder="Search carts..."
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
                <Select
                  value={productIdFilter}
                  onChange={(e) => setProductIdFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Products' },
                    ...productIds.map((pid) => ({ value: pid, label: pid })),
                  ]}
                  className="w-[180px]"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                {carts.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg border-2 border-green-200">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {carts.length} item(s) in cart
                      </p>
                      <p className="text-lg font-semibold">
                        Total: ${carts.reduce((sum, cart) => {
                          const price = parseFloat(cart.productPrice || '0');
                          const qty = parseFloat(cart.quantity || '0');
                          return sum + price * qty;
                        }, 0).toFixed(2)}
                      </p>
                    </div>
                    <Button
                      size="lg"
                      onClick={handleCheckout}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6"
                    >
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      Checkout Now
                    </Button>
                  </div>
                )}
                <CartTable
                  carts={carts}
                  onEdit={canUpdate ? openEdit : undefined}
                  onDelete={canDelete ? deleteCart : undefined}
                  onDuplicate={canDuplicate ? duplicateCart : undefined}
                  showActions={showActions}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Cart' : 'New Cart'}</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4 space-y-4">
              <CartForm form={form} onChange={setForm} />
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
              <Button onClick={saveCart} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <CartLabelsDialog open={labelsDialogOpen} onOpenChange={setLabelsDialogOpen} />
      </div>
    </ProtectedPage>
  );
}

