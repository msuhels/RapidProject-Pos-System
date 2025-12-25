'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
import type { StockAdjustment, CreateStockAdjustmentInput } from '../types';
import { StockAdjustmentTable } from '../components/StockAdjustmentTable';
import { StockAdjustmentForm } from '../components/StockAdjustmentForm';
import type { Product } from '../../products/types';

const REASON_OPTIONS = [
  { value: '', label: 'All Reasons' },
  { value: 'damage', label: 'Damage' },
  { value: 'manual_correction', label: 'Manual Correction' },
  { value: 'theft', label: 'Theft' },
  { value: 'expired', label: 'Expired' },
  { value: 'returned', label: 'Returned' },
  { value: 'found', label: 'Found' },
  { value: 'other', label: 'Other' },
];

const ADJUSTMENT_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'increase', label: 'Increase' },
  { value: 'decrease', label: 'Decrease' },
];

export default function StockAdjustmentsPage() {
  const searchParams = useSearchParams();
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState<CreateStockAdjustmentInput & { productName?: string }>({
    productId: '',
    adjustmentType: 'increase',
    quantity: 0,
    reason: '',
    notes: '',
  });
  const [savingAdjustment, setSavingAdjustment] = useState(false);

  const { hasPermission } = usePermissions();

  const canCreate = hasPermission('inventory:update') || hasPermission('inventory:*');
  const canDelete = hasPermission('inventory:delete') || hasPermission('inventory:*');
  const canView = hasPermission('inventory:read') || hasPermission('inventory:*');

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await fetch('/api/products');
      const json = await res.json();
      if (res.ok && json.success) {
        setProducts(json.data ?? []);
      }
    } catch (error) {
      console.error('Products fetch error:', error);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const fetchAdjustments = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (adjustmentType) params.set('adjustmentType', adjustmentType);
      if (reason) params.set('reason', reason);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const query = params.toString();
      const url = query ? `/api/inventory/stock-adjustments?${query}` : '/api/inventory/stock-adjustments';

      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.success) {
        setAdjustments(json.data ?? []);
      } else {
        toast.error(json.error || 'Failed to load stock adjustments');
      }
    } catch (error) {
      console.error('Adjustments fetch error:', error);
      toast.error('Failed to load stock adjustments');
    } finally {
      setLoading(false);
    }
  }, [canView, adjustmentType, reason, dateFrom, dateTo]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  // Check if productId is in query params and open dialog
  useEffect(() => {
    const productId = searchParams?.get('productId');
    if (productId && products.length > 0 && canCreate && !dialogOpen) {
      const product = products.find((p) => p.id === productId);
      if (product) {
        setAdjustmentForm({
          productId: product.id,
          adjustmentType: 'increase',
          quantity: 0,
          reason: '',
          notes: '',
          productName: product.name,
        });
        setDialogOpen(true);
        // Remove query param from URL
        window.history.replaceState({}, '', '/inventory/stock-adjustments');
      }
    }
  }, [searchParams, products, canCreate, dialogOpen]);

  const openAdjustmentForm = (product?: Product) => {
    if (!canCreate) {
      toast.error('You do not have permission to create stock adjustments');
      return;
    }
    setAdjustmentForm({
      productId: product?.id || '',
      adjustmentType: 'increase',
      quantity: 0,
      reason: '',
      notes: '',
      productName: product?.name,
    });
    setDialogOpen(true);
  };

  const saveAdjustment = async () => {
    if (!canCreate) {
      toast.error('You do not have permission to create stock adjustments');
      return;
    }

    if (!adjustmentForm.productId) {
      toast.error('Please select a product');
      return;
    }
    if (!adjustmentForm.adjustmentType || (adjustmentForm.adjustmentType !== 'increase' && adjustmentForm.adjustmentType !== 'decrease')) {
      toast.error('Please select an adjustment type');
      return;
    }
    if (!adjustmentForm.quantity || adjustmentForm.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    if (!adjustmentForm.reason) {
      toast.error('Please select a reason');
      return;
    }

    setSavingAdjustment(true);
    try {
      const payload: CreateStockAdjustmentInput = {
        productId: adjustmentForm.productId,
        adjustmentType: adjustmentForm.adjustmentType || 'increase',
        quantity: adjustmentForm.quantity,
        reason: adjustmentForm.reason,
        notes: adjustmentForm.notes,
      };

      const res = await fetch('/api/inventory/stock-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create stock adjustment');
      }

      setDialogOpen(false);
      setAdjustmentForm({
        productId: '',
        adjustmentType: 'increase',
        quantity: 0,
        reason: '',
        notes: '',
      });
      fetchAdjustments();
      toast.success('Stock adjustment created successfully');
    } catch (error) {
      console.error('Adjustment save error:', error);
      const message = error instanceof Error ? error.message : 'Failed to create stock adjustment';
      toast.error(message);
    } finally {
      setSavingAdjustment(false);
    }
  };

  const deleteAdjustment = async (adjustment: StockAdjustment) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete adjustments');
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/inventory/stock-adjustments/${adjustment.id}`, {
          method: 'DELETE',
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to delete adjustment');
        }
        await fetchAdjustments();
      })(),
      {
        loading: 'Deleting adjustment...',
        success: 'Adjustment deleted successfully',
        error: (err) => (err instanceof Error ? err.message : 'Failed to delete adjustment'),
      },
    );
  };

  const clearFilters = () => {
    setAdjustmentType('');
    setReason('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = adjustmentType || reason || dateFrom || dateTo;

  if (!canView) {
    return (
      <ProtectedPage permission="inventory:read" title="Stock Adjustments" description="Manage stock adjustments">
        <div className="w-full px-4 py-6">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              You do not have permission to view stock adjustments.
            </CardContent>
          </Card>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage permission="inventory:read" title="Stock Adjustments" description="Manage stock adjustments">
      <div className="w-full px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-2xl font-bold">Stock Adjustments</CardTitle>
            <div className="flex gap-2">
              {canCreate && (
                <Button size="sm" onClick={() => openAdjustmentForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Adjustment
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={fetchAdjustments}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex flex-1 gap-2 flex-wrap">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value)}
                  options={ADJUSTMENT_TYPE_OPTIONS}
                  className="w-[160px]"
                />
                <Select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  options={REASON_OPTIONS}
                  className="w-[180px]"
                />
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

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <StockAdjustmentTable
                adjustments={adjustments}
                loading={loading}
                onDelete={canDelete ? deleteAdjustment : undefined}
                showActions={canDelete}
              />
            )}
          </CardContent>
        </Card>

        {/* Create Adjustment Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Stock Adjustment</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4">
              <StockAdjustmentForm
                form={adjustmentForm}
                products={products}
                onChange={setAdjustmentForm}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={savingAdjustment}
              >
                Cancel
              </Button>
              <Button onClick={saveAdjustment} disabled={savingAdjustment}>
                {savingAdjustment ? 'Creating...' : 'Create Adjustment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedPage>
  );
}

