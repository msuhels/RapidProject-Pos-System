'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { RefreshCcw, Download, X, Calendar, TrendingUp, Package, Users, CreditCard, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';
import { usePermissions } from '@/core/hooks/usePermissions';
import { useDebounce } from '@/core/hooks/useDebounce';
import type { ReportRecord, ReportType } from '../types';
import { ReportTable } from '../components/ReportTable';

interface ReportSectionState {
  data: ReportRecord[];
  loading: boolean;
  dateFrom: string;
  dateTo: string;
  productId: string;
  userId: string;
}

export default function ReportsPage() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission('reports:read') || hasPermission('reports:*');
  const canExport = hasPermission('reports:export') || hasPermission('reports:*');

  // State for each report section
  const [dailySales, setDailySales] = useState<ReportSectionState>({
    data: [],
    loading: false,
    dateFrom: '',
    dateTo: '',
    productId: '',
    userId: '',
  });

  const [weeklySales, setWeeklySales] = useState<ReportSectionState>({
    data: [],
    loading: false,
    dateFrom: '',
    dateTo: '',
    productId: '',
    userId: '',
  });

  const [monthlySales, setMonthlySales] = useState<ReportSectionState>({
    data: [],
    loading: false,
    dateFrom: '',
    dateTo: '',
    productId: '',
    userId: '',
  });

  const [productWise, setProductWise] = useState<ReportSectionState>({
    data: [],
    loading: false,
    dateFrom: '',
    dateTo: '',
    productId: '',
    userId: '',
  });

  const [userWise, setUserWise] = useState<ReportSectionState>({
    data: [],
    loading: false,
    dateFrom: '',
    dateTo: '',
    productId: '',
    userId: '',
  });

  const [paymentMethodWise, setPaymentMethodWise] = useState<ReportSectionState>({
    data: [],
    loading: false,
    dateFrom: '',
    dateTo: '',
    productId: '',
    userId: '',
  });

  const [lowStock, setLowStock] = useState<ReportSectionState>({
    data: [],
    loading: false,
    dateFrom: '',
    dateTo: '',
    productId: '',
    userId: '',
  });

  const fetchReport = useCallback(
    async (reportType: ReportType, filters: { dateFrom: string; dateTo: string; productId: string; userId: string }) => {
      if (!canRead) return;

      const setStateMap = {
        daily_sales: setDailySales,
        weekly_sales: setWeeklySales,
        monthly_sales: setMonthlySales,
        product_wise: setProductWise,
        user_wise: setUserWise,
        payment_method_wise: setPaymentMethodWise,
        low_stock: setLowStock,
      };

      const setState = setStateMap[reportType];
      if (!setState) return;

      setState((prev) => ({ ...prev, loading: true }));
      try {
        const params = new URLSearchParams();
        params.set('reportType', reportType);
        if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.set('dateTo', filters.dateTo);
        if (filters.productId) params.set('productId', filters.productId);
        if (filters.userId) params.set('userId', filters.userId);

        const res = await fetch(`/api/reports?${params.toString()}`);
        const json = await res.json();

        if (res.ok && json.success) {
          setState((prev) => ({ ...prev, data: json.data ?? [], loading: false }));
        } else {
          toast.error(json.error || `Failed to load ${reportType} report`);
          setState((prev) => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error(`Report fetch error (${reportType}):`, error);
        toast.error(`Failed to load ${reportType} report`);
        setState((prev) => ({ ...prev, loading: false }));
      }
    },
    [canRead],
  );

  // Fetch all reports on mount only
  useEffect(() => {
    if (!canRead) return;

    const emptyFilters = { dateFrom: '', dateTo: '', productId: '', userId: '' };
    
    fetchReport('daily_sales', emptyFilters);
    fetchReport('weekly_sales', emptyFilters);
    fetchReport('monthly_sales', emptyFilters);
    fetchReport('product_wise', emptyFilters);
    fetchReport('user_wise', emptyFilters);
    fetchReport('payment_method_wise', emptyFilters);
    fetchReport('low_stock', emptyFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead]);

  const handleExport = async (reportType: ReportType, data: ReportRecord[]) => {
    if (!canExport) {
      toast.error('You do not have permission to export reports');
      return;
    }

    if (!data.length) {
      toast.info('No data to export');
      return;
    }

    try {
      const getHeaders = () => {
        switch (reportType) {
          case 'daily_sales':
          case 'weekly_sales':
          case 'monthly_sales':
            return ['Date', 'Quantity', 'Total Sales', 'Orders'];
          case 'product_wise':
            return ['Product Name', 'Quantity Sold', 'Total Sales', 'Orders'];
          case 'user_wise':
            return ['User Name', 'Quantity', 'Total Sales', 'Orders'];
          case 'payment_method_wise':
            return ['Payment Method', 'Quantity', 'Total Sales', 'Orders'];
          case 'low_stock':
            return ['Product', 'Current Stock', 'Total Sold'];
          default:
            return ['Date', 'Quantity', 'Price'];
        }
      };

      const headers = getHeaders();
      const rows = data.map((report) => {
        switch (reportType) {
          case 'daily_sales':
          case 'weekly_sales':
          case 'monthly_sales':
            return [
              report.date || '',
              report.quantity.toString(),
              (report.totalAmount || 0).toFixed(2),
              (report.orderCount || 0).toString(),
            ];
          case 'product_wise':
            return [
              report.productName || 'Unknown',
              report.quantity.toString(),
              (report.totalAmount || 0).toFixed(2),
              (report.orderCount || 0).toString(),
            ];
          case 'user_wise':
            return [
              report.userName || report.userId || 'Unknown',
              report.quantity.toString(),
              (report.totalAmount || 0).toFixed(2),
              (report.orderCount || 0).toString(),
            ];
          case 'payment_method_wise':
            return [
              report.paymentMethod || 'N/A',
              report.quantity.toString(),
              (report.totalAmount || 0).toFixed(2),
              (report.orderCount || 0).toString(),
            ];
          case 'low_stock':
            return [
              report.productName || report.productId || 'Unknown',
              report.quantity.toString(),
              (report.totalAmount || 0).toString(),
            ];
          default:
            return [report.date || '', report.quantity.toString(), report.price.toFixed(2)];
        }
      });

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reports-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  // Report Section Component
  const ReportSection = ({
    title,
    description,
    icon: Icon,
    reportType,
    state,
    setState,
    showProductFilter = false,
    showUserFilter = false,
  }: {
    title: string;
    description: string;
    icon: React.ElementType;
    reportType: ReportType;
    state: ReportSectionState;
    setState: React.Dispatch<React.SetStateAction<ReportSectionState>>;
    showProductFilter?: boolean;
    showUserFilter?: boolean;
  }) => {
    const debouncedProductId = useDebounce(state.productId, 500);
    const debouncedUserId = useDebounce(state.userId, 500);
    const isInitialMount = useRef(true);
    const prevFiltersRef = useRef({ dateFrom: '', dateTo: '', productId: '', userId: '' });

    // Refetch when debounced filters or date filters change (but not on initial mount)
    useEffect(() => {
      // Skip on initial mount - data is already fetched in parent useEffect
      if (isInitialMount.current) {
        isInitialMount.current = false;
        prevFiltersRef.current = {
          dateFrom: state.dateFrom,
          dateTo: state.dateTo,
          productId: debouncedProductId,
          userId: debouncedUserId,
        };
        return;
      }

      // Only fetch if filters actually changed
      const filtersChanged =
        prevFiltersRef.current.dateFrom !== state.dateFrom ||
        prevFiltersRef.current.dateTo !== state.dateTo ||
        prevFiltersRef.current.productId !== debouncedProductId ||
        prevFiltersRef.current.userId !== debouncedUserId;

      if (filtersChanged) {
        prevFiltersRef.current = {
          dateFrom: state.dateFrom,
          dateTo: state.dateTo,
          productId: debouncedProductId,
          userId: debouncedUserId,
        };

        const filters = {
          dateFrom: state.dateFrom,
          dateTo: state.dateTo,
          productId: debouncedProductId,
          userId: debouncedUserId,
        };
        fetchReport(reportType, filters);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedProductId, debouncedUserId, state.dateFrom, state.dateTo, reportType]);

    const hasActiveFilters = state.dateFrom || state.dateTo || state.productId || state.userId;

    const clearFilters = () => {
      setState((prev) => ({
        ...prev,
        dateFrom: '',
        dateTo: '',
        productId: '',
        userId: '',
      }));
    };

    const handleRefresh = () => {
      const filters = {
        dateFrom: state.dateFrom,
        dateTo: state.dateTo,
        productId: state.productId,
        userId: state.userId,
      };
      fetchReport(reportType, filters);
    };

    return (
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                <CardDescription className="text-sm">{description}</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {canExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(reportType, state.data)}
                  disabled={!state.data.length || state.loading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={state.loading}
              >
                <RefreshCcw className={`h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex flex-1 gap-2 flex-wrap">
              {showProductFilter && (
                <div className="relative flex-1 max-w-md">
                  <Input
                    placeholder="Product ID (optional)"
                    value={state.productId}
                    onChange={(e) => setState((prev) => ({ ...prev, productId: e.target.value }))}
                  />
                </div>
              )}
              {showUserFilter && (
                <div className="relative flex-1 max-w-md">
                  <Input
                    placeholder="User ID (optional)"
                    value={state.userId}
                    onChange={(e) => setState((prev) => ({ ...prev, userId: e.target.value }))}
                  />
                </div>
              )}
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
                  value={state.dateFrom}
                  onChange={(e) => setState((prev) => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-[150px]"
                />
                <Input
                  type="date"
                  placeholder="To Date"
                  value={state.dateTo}
                  onChange={(e) => setState((prev) => ({ ...prev, dateTo: e.target.value }))}
                  className="w-[150px]"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {state.loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <ReportTable reports={state.data} reportType={reportType} loading={state.loading} />
          )}
        </CardContent>
      </Card>
    );
  };

  if (!canRead) {
    return (
      <ProtectedPage permission="reports:read" title="Reports" description="Business insights">
        <div className="w-full px-4 py-6">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              You do not have permission to view reports.
            </CardContent>
          </Card>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage permission="reports:read" title="Reports" description="Business insights and analytics">
      <div className="w-full px-4 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports Dashboard</h1>
            <p className="text-muted-foreground mt-1">Comprehensive business insights and analytics</p>
          </div>
        </div>

        {/* Sales Reports - Sequential */}
        <div className="space-y-6">
          <ReportSection
            title="Daily Sales Report"
            description="Daily sales breakdown by date"
            icon={Calendar}
            reportType="daily_sales"
            state={dailySales}
            setState={setDailySales}
          />

          <ReportSection
            title="Weekly Sales Report"
            description="Weekly sales aggregated by week"
            icon={TrendingUp}
            reportType="weekly_sales"
            state={weeklySales}
            setState={setWeeklySales}
          />

          <ReportSection
            title="Monthly Sales Report"
            description="Monthly sales aggregated by month"
            icon={TrendingUp}
            reportType="monthly_sales"
            state={monthlySales}
            setState={setMonthlySales}
          />
        </div>

        {/* Product & User Reports - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReportSection
            title="Product Wise Sales"
            description="Sales breakdown by product"
            icon={Package}
            reportType="product_wise"
            state={productWise}
            setState={setProductWise}
            showProductFilter={true}
          />

          <ReportSection
            title="User Wise Sales"
            description="Sales breakdown by user"
            icon={Users}
            reportType="user_wise"
            state={userWise}
            setState={setUserWise}
            showUserFilter={true}
          />
        </div>

        {/* Payment Method & Low Stock - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReportSection
            title="Payment Method Wise"
            description="Sales breakdown by payment method"
            icon={CreditCard}
            reportType="payment_method_wise"
            state={paymentMethodWise}
            setState={setPaymentMethodWise}
          />

          <ReportSection
            title="Low Stock Report"
            description="Products with low inventory levels"
            icon={AlertTriangle}
            reportType="low_stock"
            state={lowStock}
            setState={setLowStock}
          />
        </div>
      </div>
    </ProtectedPage>
  );
}
