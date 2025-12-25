'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { TableActions } from '@/core/components/common/TableActions';
import type { StockAdjustment } from '../types';

interface StockAdjustmentTableProps {
  adjustments: StockAdjustment[];
  loading?: boolean;
  onEdit?: (adjustment: StockAdjustment) => void;
  onDelete?: (adjustment: StockAdjustment) => void;
  showActions?: boolean;
}

export function StockAdjustmentTable({
  adjustments,
  loading = false,
  onEdit,
  onDelete,
  showActions = true,
}: StockAdjustmentTableProps) {
  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">Loading adjustments...</div>
    );
  }

  if (!adjustments.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">No stock adjustments found.</div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Previous Qty</TableHead>
            <TableHead>New Qty</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Date</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {adjustments.map((adjustment) => (
            <TableRow key={adjustment.id}>
              <TableCell>{adjustment.productName || adjustment.productId}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    adjustment.adjustmentType === 'increase'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}
                >
                  {adjustment.adjustmentType === 'increase' ? '↑ Increase' : '↓ Decrease'}
                </span>
              </TableCell>
              <TableCell className="font-medium">{adjustment.quantity}</TableCell>
              <TableCell>{adjustment.previousQuantity}</TableCell>
              <TableCell className="font-medium">{adjustment.newQuantity}</TableCell>
              <TableCell>{adjustment.reason}</TableCell>
              <TableCell>{new Date(adjustment.createdAt).toLocaleDateString()}</TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <TableActions
                    item={adjustment}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

