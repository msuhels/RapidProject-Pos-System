'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { Plus, RefreshCcw, Download, Upload, X, CreditCard, Search, Calendar, Filter } from 'lucide-react';
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
import { useAuthStore } from '@/core/store/authStore';
import type { Payment, CreatePaymentInput, PaymentMethod } from '../types';
import { PaymentForm } from '../components/PaymentForm';
import { PaymentTable } from '../components/PaymentTable';
import { PaymentMethodDialog } from '../components/PaymentMethodDialog';

const defaultForm: CreatePaymentInput = {
  saleReference: '',
  paymentMethodId: '',
  amount: 0,
  paymentStatus: 'paid',
  transactionReference: null,
  paymentDate: new Date().toISOString(),
  notes: '',
  customFields: {},
};

export default function PaymentsPage() {
  const [records, setRecords] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reverseDialogOpen, setReverseDialogOpen] = useState(false);
  const [methodDialogOpen, setMethodDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reversingPayment, setReversingPayment] = useState<Payment | null>(null);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState<CreatePaymentInput>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { accessToken } = useAuthStore();

  const { hasPermission } = usePermissions();
  const debouncedSearch = useDebounce(search, 300);

  const canCreate = hasPermission('payment_management:create_payment') || hasPermission('payment_management:*');
  const canUpdate = hasPermission('payment_management:update_payment_status') || hasPermission('payment_management:*');
  const canReverse = hasPermission('payment_management:reverse_payment') || hasPermission('payment_management:*');
  const canManageMethods = hasPermission('payment_management:manage_payment_methods') || hasPermission('payment_management:*');
  const canExport = hasPermission('payment_management:export') || hasPermission('payment_management:*');
  const canImport = hasPermission('payment_management:import') || hasPermission('payment_management:*');

  const showActions = canUpdate || canReverse;

  const fetchPaymentMethods = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch('/api/payments/methods', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setPaymentMethods(json.data ?? []);
      }
    } catch (error) {
      console.error('Payment methods fetch error:', error);
    }
  }, [accessToken]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (paymentStatusFilter !== 'all') params.set('paymentStatus', paymentStatusFilter);
      if (paymentMethodFilter !== 'all') params.set('paymentMethodId', paymentMethodFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const query = params.toString();
      const url = query ? `/api/payments?${query}` : '/api/payments';

      const res = await fetch(url);
      const json = await res.json();

      if (res.ok && json.success) {
        setRecords(json.data ?? []);
      } else {
        toast.error(json.error || 'Failed to load payments');
      }
    } catch (error) {
      console.error('Payment fetch error:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, paymentStatusFilter, paymentMethodFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchRecords();
    fetchPaymentMethods();
  }, [fetchRecords, fetchPaymentMethods]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const openCreate = () => {
    if (!canCreate) {
      toast.error('You do not have permission to create payments');
      return;
    }
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (record: Payment) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update payments');
      return;
    }
    setEditingId(record.id);
    setForm({
      saleReference: record.saleReference,
      paymentMethodId: record.paymentMethodId,
      amount: record.amount,
      paymentStatus: record.paymentStatus,
      transactionReference: record.transactionReference,
      paymentDate: record.paymentDate,
      notes: record.notes || '',
      customFields: record.customFields ?? {},
    });
    setDialogOpen(true);
  };

  const saveRecord = async () => {
    if (editingId && !canUpdate) {
      toast.error('You do not have permission to update payments');
      return;
    }
    if (!editingId && !canCreate) {
      toast.error('You do not have permission to create payments');
      return;
    }

    if (!form.saleReference.trim()) {
      toast.error('Sale reference is required');
      return;
    }
    if (!form.paymentMethodId) {
      toast.error('Payment method is required');
      return;
    }
    if (!form.amount || form.amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/payments/${editingId}` : '/api/payments';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save payment');
      }

      setDialogOpen(false);
      resetForm();
      fetchRecords();
      toast.success(editingId ? 'Payment updated' : 'Payment created');
    } catch (error) {
      console.error('Payment save error:', error);
      const message = error instanceof Error ? error.message : 'Failed to save payment';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const openReverse = (record: Payment) => {
    if (!canReverse) {
      toast.error('You do not have permission to reverse payments');
      return;
    }
    if (record.isReversed) {
      toast.error('Payment is already reversed');
      return;
    }
    setReversingPayment(record);
    setReverseDialogOpen(true);
  };

  const reversePayment = async () => {
    if (!reversingPayment) return;

    toast.promise(
      (async () => {
        const res = await fetch(`/api/payments/${reversingPayment.id}/reverse`, {
          method: 'POST',
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to reverse payment');
        }
        await fetchRecords();
        setReverseDialogOpen(false);
        setReversingPayment(null);
      })(),
      {
        loading: 'Reversing payment...',
        success: 'Payment reversed successfully',
        error: (err) => (err instanceof Error ? err.message : 'Failed to reverse payment'),
      },
    );
  };

  const openMethodDialog = (method?: PaymentMethod) => {
    if (!canManageMethods) {
      toast.error('You do not have permission to manage payment methods');
      return;
    }
    setEditingMethod(method || null);
    setMethodDialogOpen(true);
  };

  const savePaymentMethod = async (data: any) => {
    try {
      const method = editingMethod ? 'PATCH' : 'POST';
      const url = editingMethod ? `/api/payments/methods/${editingMethod.id}` : '/api/payments/methods';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save payment method');
      }

      await fetchPaymentMethods();
      toast.success(editingMethod ? 'Payment method updated' : 'Payment method created');
    } catch (error) {
      console.error('Payment method save error:', error);
      const message = error instanceof Error ? error.message : 'Failed to save payment method';
      toast.error(message);
      throw error;
    }
  };

  const handleExport = async () => {
    if (!canExport) {
      toast.error('You do not have permission to export payments');
      return;
    }

    try {
      const res = await fetch('/api/payments/export');
      if (!res.ok) {
        throw new Error('Failed to export payments');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Payments exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export payments');
    }
  };

  const handleImport = async () => {
    if (!canImport) {
      toast.error('You do not have permission to import payments');
      return;
    }

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/payments/import', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to import payments');
      }

      const { imported, failed, errors } = json.data;
      setImportDialogOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchRecords();

      if (failed > 0) {
        toast.warning(`Imported ${imported} payments, ${failed} failed. Check console for details.`);
        console.error('Import errors:', errors);
      } else {
        toast.success(`Successfully imported ${imported} payments`);
      }
    } catch (error) {
      console.error('Import error:', error);
      const message = error instanceof Error ? error.message : 'Failed to import payments';
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setPaymentStatusFilter('all');
    setPaymentMethodFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters =
    search || paymentStatusFilter !== 'all' || paymentMethodFilter !== 'all' || dateFrom || dateTo;

  return (
    <ProtectedPage
      permission="payment_management:view_payment"
      title="Payments"
      description="Track all payments received against sales, including partial payments, refunds, and payment methods"
    >
      <div className="w-full px-4 py-6 space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
              <p className="text-muted-foreground mt-1">
                Track all payments received against sales, including partial payments, refunds, and payment methods
              </p>
            </div>
            <div className="flex gap-2">
              {canCreate && (
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              )}
              {canManageMethods && (
                <Button variant="outline" onClick={() => openMethodDialog()}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payment Methods
                </Button>
              )}
              {canExport && (
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              {canImport && (
                <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={fetchRecords} title="Refresh">
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search and Filters Section */}
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by sale reference or transaction reference..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-end gap-3 pb-2 border-b">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium">Filters:</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-muted-foreground font-medium">Status</label>
                      <Select
                        value={paymentStatusFilter}
                        onChange={(e) => setPaymentStatusFilter(e.target.value)}
                        options={[
                          { value: 'all', label: 'All statuses' },
                          { value: 'paid', label: 'Paid' },
                          { value: 'partial', label: 'Partial' },
                          { value: 'refunded', label: 'Refunded' },
                        ]}
                        className="w-[140px]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-muted-foreground font-medium">Payment Method</label>
                      <Select
                        value={paymentMethodFilter}
                        onChange={(e) => setPaymentMethodFilter(e.target.value)}
                        options={[
                          { value: 'all', label: 'All methods' },
                          ...paymentMethods.map((method) => ({
                            value: method.id,
                            label: method.name,
                          })),
                        ]}
                        className="w-[160px]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-muted-foreground font-medium">From Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-[160px] pl-10"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-muted-foreground font-medium">To Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-[160px] pl-10"
                        />
                      </div>
                    </div>
                    {hasActiveFilters && (
                      <div className="flex items-end">
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                          <X className="h-4 w-4 mr-2" />
                          Clear filters
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <LoadingSpinner />
              </div>
            ) : (
              <PaymentTable
                records={records}
                onEdit={canUpdate ? openEdit : undefined}
                onReverse={canReverse ? openReverse : undefined}
                showActions={showActions}
                search={search}
                paymentStatusFilter={paymentStatusFilter}
                paymentMethodFilter={paymentMethodFilter}
                dateFrom={dateFrom}
                dateTo={dateTo}
              />
            )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Payment' : 'New Payment'}</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4">
              <PaymentForm form={form} onChange={setForm} paymentMethods={paymentMethods} />
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

        <Dialog open={reverseDialogOpen} onOpenChange={setReverseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reverse Payment</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to reverse this payment? This action cannot be undone.
              </p>
              {reversingPayment && (
                <div className="mt-4 p-3 bg-muted rounded">
                  <p className="text-sm">
                    <strong>Sale Reference:</strong> {reversingPayment.saleReference}
                  </p>
                  <p className="text-sm">
                    <strong>Amount:</strong> ${reversingPayment.amount.toFixed(2)}
                  </p>
                  <p className="text-sm">
                    <strong>Payment Method:</strong> {reversingPayment.paymentMethod?.name}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReverseDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={reversePayment}>
                Reverse Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <PaymentMethodDialog
          open={methodDialogOpen}
          onOpenChange={setMethodDialogOpen}
          method={editingMethod}
          onSave={savePaymentMethod}
        />

        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Payments</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select CSV file</label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  CSV file should include headers matching field names.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImportDialogOpen(false)} disabled={importing}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? 'Importing...' : 'Import'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedPage>
  );
}

