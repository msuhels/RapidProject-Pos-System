'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { Plus, RefreshCcw, Download, Upload, X } from 'lucide-react';
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
import type { CustomerRecord, CreateCustomerInput } from '../types';
import { CustomerForm } from '../components/CustomerForm';
import { CustomerTable } from '../components/CustomerTable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';

const defaultForm: CreateCustomerInput = {
  name: '',
  phoneNumber: '',
  email: '',
  totalPurchases: 0,
  outstandingBalance: 0,
  isActive: true,
  customFields: {},
};

export default function CustomersPage() {
  const [records, setRecords] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  const [hasOutstandingBalanceFilter, setHasOutstandingBalanceFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [salesHistoryDialogOpen, setSalesHistoryDialogOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<CustomerRecord | null>(null);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<CustomerRecord | null>(null);
  const [form, setForm] = useState<CreateCustomerInput>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { hasPermission } = usePermissions();
  const debouncedSearch = useDebounce(search, 300);

  const canCreate = hasPermission('customer_management:create') || hasPermission('customer_management:*');
  const canUpdate = hasPermission('customer_management:update') || hasPermission('customer_management:*');
  const canDelete = hasPermission('customer_management:delete') || hasPermission('customer_management:*');
  const canDeactivate = hasPermission('customer_management:deactivate') || hasPermission('customer_management:*');
  const canExport = hasPermission('customer_management:export') || hasPermission('customer_management:*');
  const canImport = hasPermission('customer_management:import') || hasPermission('customer_management:*');
  const canRead = hasPermission('customer_management:read') || hasPermission('customer_management:*');

  const showActions = canUpdate || canDelete || canDeactivate || canRead;

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (isActiveFilter !== 'all') params.set('isActive', isActiveFilter);
      if (hasOutstandingBalanceFilter === 'true') params.set('hasOutstandingBalance', 'true');

      const query = params.toString();
      const url = query ? `/api/customers?${query}` : '/api/customers';

      const res = await fetch(url);
      const json = await res.json();

      if (res.ok && json.success) {
        setRecords(json.data ?? []);
      } else {
        toast.error(json.error || 'Failed to load customers');
      }
    } catch (error) {
      console.error('Customer fetch error:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, isActiveFilter, hasOutstandingBalanceFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Automatically recalculate totals and cleanup duplicates on page load (only once per session)
  useEffect(() => {
    const autoFixKey = 'customer_management_auto_fix_done';
    if (sessionStorage.getItem(autoFixKey)) {
      return; // Already ran in this session
    }

    const autoFix = async () => {
      if (!canUpdate) return;
      
      try {
        // First cleanup duplicates (silent, no user notification)
        const cleanupRes = await fetch('/api/customers/cleanup-duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const cleanupJson = await cleanupRes.json();
        if (cleanupRes.ok && cleanupJson.success && (cleanupJson.data.deleted > 0 || cleanupJson.data.merged > 0)) {
          console.log('[Auto-fix] Cleaned duplicates:', cleanupJson.data);
        }

        // Then recalculate totals (silent, no user notification)
        const recalcRes = await fetch('/api/customers/recalculate-totals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const recalcJson = await recalcRes.json();
        if (recalcRes.ok && recalcJson.success) {
          console.log('[Auto-fix] Recalculated totals:', recalcJson.data);
          // Refresh records to show updated totals
          setTimeout(() => fetchRecords(), 500);
        }

        // Mark as done for this session
        sessionStorage.setItem(autoFixKey, 'true');
      } catch (error) {
        console.error('[Auto-fix] Error (non-critical):', error);
        // Don't show error to user, this is background operation
      }
    };

    // Run auto-fix once after initial load (wait for records to load first)
    const timer = setTimeout(autoFix, 3000); // Wait 3 seconds after page load
    return () => clearTimeout(timer);
  }, [canUpdate, fetchRecords]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const openCreate = () => {
    if (!canCreate) {
      toast.error('You do not have permission to create customers');
      return;
    }
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (record: CustomerRecord) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update customers');
      return;
    }
    setEditingId(record.id);
    setForm({
      name: record.name,
      phoneNumber: record.phoneNumber ?? '',
      email: record.email ?? '',
      totalPurchases: record.totalPurchases,
      outstandingBalance: record.outstandingBalance,
      isActive: record.isActive,
      customFields: record.customFields ?? {},
    });
    setDialogOpen(true);
  };

  const saveRecord = async () => {
    if (editingId && !canUpdate) {
      toast.error('You do not have permission to update customers');
      return;
    }
    if (!editingId && !canCreate) {
      toast.error('You do not have permission to create customers');
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
      const url = editingId ? `/api/customers/${editingId}` : '/api/customers';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, name: trimmedName }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save customer');
      }

      setDialogOpen(false);
      resetForm();
      fetchRecords();
      toast.success(editingId ? 'Customer updated' : 'Customer created');
    } catch (error) {
      console.error('Customer save error:', error);
      const message = error instanceof Error ? error.message : 'Failed to save customer';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (record: CustomerRecord) => {
    if (!canDelete && !canDeactivate) {
      toast.error('You do not have permission to delete or deactivate customers');
      return;
    }
    setDeletingRecord(record);
    setDeleteDialogOpen(true);
  };

  const deleteRecord = async (hardDelete: boolean = false) => {
    if (!deletingRecord) return;

    if (hardDelete && !canDelete) {
      toast.error('You do not have permission to permanently delete customers');
      return;
    }

    if (!hardDelete && !canDeactivate) {
      toast.error('You do not have permission to deactivate customers');
      return;
    }

    toast.promise(
      (async () => {
        const url = `/api/customers/${deletingRecord.id}${hardDelete ? '?hardDelete=true' : ''}`;
        const res = await fetch(url, { method: 'DELETE' });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to delete customer');
        }
        await fetchRecords();
        setDeleteDialogOpen(false);
        setDeletingRecord(null);
      })(),
      {
        loading: hardDelete ? 'Deleting customer...' : 'Deactivating customer...',
        success: hardDelete ? 'Customer deleted successfully' : 'Customer deactivated successfully',
        error: (err) => (err instanceof Error ? err.message : 'Failed to delete customer'),
      },
    );
  };

  const handleExport = async () => {
    if (!canExport) {
      toast.error('You do not have permission to export customers');
      return;
    }

    try {
      const res = await fetch('/api/customers/export');
      if (!res.ok) {
        throw new Error('Failed to export customers');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Customers exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export customers');
    }
  };

  const handleImport = async () => {
    if (!canImport) {
      toast.error('You do not have permission to import customers');
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

      const res = await fetch('/api/customers/import', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to import customers');
      }

      const { imported, failed, errors } = json.data;
      setImportDialogOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchRecords();

      if (failed > 0) {
        toast.warning(`Imported ${imported} customers, ${failed} failed. Check console for details.`);
        console.error('Import errors:', errors);
      } else {
        toast.success(`Successfully imported ${imported} customers`);
      }
    } catch (error) {
      console.error('Import error:', error);
      const message = error instanceof Error ? error.message : 'Failed to import customers';
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setIsActiveFilter('all');
    setHasOutstandingBalanceFilter('all');
  };

  const hasActiveFilters = search || isActiveFilter !== 'all' || hasOutstandingBalanceFilter !== 'all';

  const openSalesHistory = async (record: CustomerRecord) => {
    setViewingCustomer(record);
    setSalesHistoryDialogOpen(true);
    setLoadingHistory(true);
    setSalesHistory([]);

    try {
      const res = await fetch(`/api/customers/sales-history?customerId=${record.id}`);
      const json = await res.json();

      if (res.ok && json.success) {
        setSalesHistory(json.data || []);
      } else {
        toast.error(json.error || 'Failed to load sales history');
      }
    } catch (error) {
      console.error('Sales history fetch error:', error);
      toast.error('Failed to load sales history');
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <ProtectedPage
      permission="customer_management:read"
      title="Customers"
      description="Manage customer records, contact details, and purchase history"
    >
      <div className="w-full px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-2xl font-bold">Customers</CardTitle>
            <div className="flex gap-2">
              {canCreate && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              )}
              {canExport && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              {canImport && (
                <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
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
                    placeholder="Search by name, phone, or email"
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
                  value={isActiveFilter}
                  onChange={(e) => setIsActiveFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All statuses' },
                    { value: 'true', label: 'Active' },
                    { value: 'false', label: 'Inactive' },
                  ]}
                  className="w-[140px]"
                />
                <Select
                  value={hasOutstandingBalanceFilter}
                  onChange={(e) => setHasOutstandingBalanceFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All balances' },
                    { value: 'true', label: 'Has balance' },
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
              <CustomerTable
                records={records}
                onEdit={canUpdate ? openEdit : undefined}
                onDelete={(canDelete || canDeactivate) ? openDelete : undefined}
                onViewSalesHistory={openSalesHistory}
                showActions={true}
              />
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Customer' : 'New Customer'}</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4">
              <CustomerForm form={form} onChange={setForm} />
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
              <DialogTitle>Delete Customer</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to {canDelete ? 'permanently delete' : 'deactivate'} this customer?
                {canDelete && (
                  <span className="block mt-2 text-destructive">
                    This action cannot be undone. Hard delete is only allowed if the customer has no sales history.
                  </span>
                )}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              {canDeactivate && (
                <Button variant="outline" onClick={() => deleteRecord(false)}>
                  Deactivate
                </Button>
              )}
              {canDelete && (
                <Button variant="destructive" onClick={() => deleteRecord(true)}>
                  Delete Permanently
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Customers</DialogTitle>
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

        <Dialog open={salesHistoryDialogOpen} onOpenChange={setSalesHistoryDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Sales History - {viewingCustomer?.name || 'Customer'}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : salesHistory.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No sales history found for this customer.
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order Date</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesHistory.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            {new Date(order.orderDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {order.products?.map((product: any, idx: number) => (
                                <div key={idx} className="text-sm">
                                  <span className="font-medium">{product.productName || product.productId}</span>
                                  {' - '}
                                  Qty: {product.quantity} @ ${product.price}
                                  {' = '}
                                  <span className="font-semibold">${(parseFloat(product.price || '0') * parseFloat(product.quantity || '0')).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${order.totalAmount || '0.00'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSalesHistoryDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedPage>
  );
}


