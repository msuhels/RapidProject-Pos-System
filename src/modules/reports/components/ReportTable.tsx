'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import type { ReportRecord, ReportType } from '../types';

interface ReportTableProps {
  reports: ReportRecord[];
  reportType: ReportType;
  loading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

export function ReportTable({ reports, reportType, loading = false }: ReportTableProps) {
  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">Loading reports...</div>
    );
  }

  if (!reports.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">No report data available.</div>
    );
  }

  // Define columns based on report type
  const getColumns = () => {
    switch (reportType) {
      case 'daily_sales':
      case 'weekly_sales':
      case 'monthly_sales':
        return [
          { key: 'date', label: 'Date' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'totalAmount', label: 'Total Sales' },
          { key: 'orderCount', label: 'Orders' },
        ];
      case 'product_wise':
        return [
          { key: 'productId', label: 'Product ID' },
          { key: 'productName', label: 'Product Name' },
          { key: 'quantity', label: 'Quantity Sold' },
          { key: 'totalAmount', label: 'Total Sales' },
          { key: 'orderCount', label: 'Orders' },
        ];
      case 'user_wise':
        return [
          { key: 'userId', label: 'User ID' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'totalAmount', label: 'Total Sales' },
          { key: 'orderCount', label: 'Orders' },
        ];
      case 'payment_method_wise':
        return [
          { key: 'paymentMethod', label: 'Payment Method' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'totalAmount', label: 'Total Sales' },
          { key: 'orderCount', label: 'Orders' },
        ];
      case 'low_stock':
        return [
          { key: 'productName', label: 'Product' },
          { key: 'quantity', label: 'Current Stock' },
          { key: 'totalAmount', label: 'Total Sold' },
        ];
      default:
        return [
          { key: 'date', label: 'Date' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'price', label: 'Price' },
        ];
    }
  };

  const columns = getColumns();

  const renderCell = (record: ReportRecord, key: string) => {
    switch (key) {
      case 'date':
        return formatDate(record.date);
      case 'quantity':
        return record.quantity.toLocaleString();
      case 'totalAmount':
        return formatCurrency(record.totalAmount || 0);
      case 'price':
        return formatCurrency(record.price);
      case 'productId':
        return record.productId || 'Unknown';
      case 'productName':
        return record.productName || 'Unknown';
      case 'userId':
        return record.userId || 'Unknown';
      case 'paymentMethod':
        return record.paymentMethod || 'N/A';
      case 'orderCount':
        return record.orderCount?.toLocaleString() || '0';
      default:
        return String(record[key as keyof ReportRecord] || '-');
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report, index) => (
            <TableRow key={index}>
              {columns.map((col) => (
                <TableCell key={col.key}>{renderCell(report, col.key)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

