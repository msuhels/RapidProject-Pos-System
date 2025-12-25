'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCcw, Download, X } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';
import { usePermissions } from '@/core/hooks/usePermissions';
import { useDebounce } from '@/core/hooks/useDebounce';
import type { ReportRecord, ReportType } from '../types';
import { ReportTable } from '../components/ReportTable';

const REPORT_TYPES: Array<{ value: ReportType; label: string }> = [
  { value: 'daily_sales', label: 'Daily Sales' },
  { value: 'weekly_sales', label: 'Weekly Sales' },
  { value: 'monthly_sales', label: 'Monthly Sales' },
  { value: 'product_wise', label: 'Product Wise' },
  { value: 'user_wise', label: 'User Wise' },
  { value: 'payment_method_wise', label: 'Payment Method Wise' },
  { value: 'low_stock', label: 'Low Stock' },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('daily_sales');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [productId, setProductId] = useState('');
  const [userId, setUserId] = useState('');

  const { hasPermission } = usePermissions();

  const canRead = hasPermission('reports:read') || hasPermission('reports:*');
  const canExport = hasPermission('reports:export') || hasPermission('reports:*');

  const fetchReports = useCallback(async () => {
    if (!canRead) {
      toast.error('You do not have permission to view reports');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('reportType', reportType);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (productId) params.set('productId', productId);
      if (userId) params.set('userId', userId);

      const res = await fetch(`/api/reports?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.success) {
        setReports(json.data ?? []);
      } else {
        toast.error(json.error || 'Failed to load reports');
      }
    } catch (error) {
      console.error('Reports fetch error:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [canRead, reportType, dateFrom, dateTo, productId, userId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExport = async () => {
    if (!canExport) {
      toast.error('You do not have permission to export reports');
      return;
    }

    if (!reports.length) {
      toast.info('No reports to export');
      return;
    }

    try {
      // Get column headers based on report type
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
      const rows = reports.map((report) => {
        switch (reportType) {
          case 'daily_sales':
          case 'weekly_sales':
          case 'monthly_sales':
            return [
              report.date,
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
            return [report.date, report.quantity.toString(), report.price.toFixed(2)];
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
      toast.success('Reports exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export reports');
    }
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setProductId('');
    setUserId('');
  };

  const hasActiveFilters = dateFrom || dateTo || productId || userId;

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
    <ProtectedPage permission="reports:read" title="Reports" description="Business insights">
      <div className="w-full px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-2xl font-bold">Reports</CardTitle>
            <div className="flex gap-2">
              {canExport && (
                <Button variant="outline" size="sm" onClick={handleExport} disabled={!reports.length}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={fetchReports}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Report Type Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-border pb-4">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setReportType(type.value)}
                  className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
                    reportType === type.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex flex-1 gap-2 flex-wrap">
                {reportType === 'product_wise' && (
                  <div className="relative flex-1 max-w-md">
                    <Input
                      placeholder="Product ID (optional)"
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                    />
                  </div>
                )}
                {reportType === 'user_wise' && (
                  <div className="relative flex-1 max-w-md">
                    <Input
                      placeholder="User ID (optional)"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
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

            {/* Report Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <ReportTable reports={reports} reportType={reportType} loading={loading} />
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}

