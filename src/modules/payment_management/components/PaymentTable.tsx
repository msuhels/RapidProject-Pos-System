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
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import { usePaymentCustomFields } from '../hooks/usePaymentCustomFields';
import type { Payment } from '../types';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { RotateCcw, CreditCard } from 'lucide-react';
import { usePermissions } from '@/core/hooks/usePermissions';

interface PaymentTableProps {
  records: Payment[];
  loading?: boolean;
  onEdit?: (record: Payment) => void;
  onReverse?: (record: Payment) => void;
  showActions?: boolean;
  search?: string;
  paymentStatusFilter?: string;
  paymentMethodFilter?: string;
  dateFrom?: string;
  dateTo?: string;
}

const STANDARD_FIELDS = [
  { code: 'sale_reference', label: 'Sale Reference', render: (r: Payment) => r.saleReference },
  {
    code: 'payment_method_id',
    label: 'Payment Method',
    render: (r: Payment) => r.paymentMethod?.name ?? '-',
  },
  {
    code: 'amount',
    label: 'Amount',
    render: (r: Payment) => `$${r.amount.toFixed(2)}`,
  },
  {
    code: 'payment_status',
    label: 'Status',
    render: (r: Payment) => {
      const statusColors: Record<string, string> = {
        paid: 'bg-green-100 text-green-800',
        partial: 'bg-yellow-100 text-yellow-800',
        refunded: 'bg-red-100 text-red-800',
      };
      return (
        <Badge className={statusColors[r.paymentStatus] || 'bg-gray-100 text-gray-800'}>
          {r.paymentStatus.charAt(0).toUpperCase() + r.paymentStatus.slice(1)}
        </Badge>
      );
    },
  },
  {
    code: 'transaction_reference',
    label: 'Transaction Ref',
    render: (r: Payment) => r.transactionReference ?? '-',
  },
  {
    code: 'payment_date',
    label: 'Payment Date',
    render: (r: Payment) => new Date(r.paymentDate).toLocaleDateString(),
  },
  {
    code: 'is_reversed',
    label: 'Reversed',
    render: (r: Payment) => (
      <span className={r.isReversed ? 'text-red-600 font-medium' : 'text-gray-500'}>
        {r.isReversed ? 'Yes' : 'No'}
      </span>
    ),
  },
] as const;

export function PaymentTable({
  records,
  loading = false,
  onEdit,
  onReverse,
  showActions = true,
  search,
  paymentStatusFilter,
  paymentMethodFilter,
  dateFrom,
  dateTo,
}: PaymentTableProps) {
  const { isFieldVisible, loading: loadingPerms } = useFieldPermissions('payment_management');
  const { customFields } = usePaymentCustomFields();
  const { hasPermission } = usePermissions();

  const canReverse = hasPermission('payment_management:reverse_payment') || hasPermission('payment_management:*');

  if (loading || loadingPerms) {
    return (
      <div className="py-8 text-center text-muted-foreground">Loading records...</div>
    );
  }

  if (!records.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="rounded-full bg-muted p-4 mb-4">
          <CreditCard className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No payments found</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {search || paymentStatusFilter !== 'all' || paymentMethodFilter !== 'all' || dateFrom || dateTo
            ? 'Try adjusting your filters to see more results.'
            : 'Get started by creating your first payment record.'}
        </p>
      </div>
    );
  }

  const visibleStandardFields = STANDARD_FIELDS.filter((field) =>
    isFieldVisible('payment_management', field.code),
  );

  const visibleCustomFields = customFields.filter(
    (field) => field.metadata?.showInTable && isFieldVisible('payment_management', field.code),
  );

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleStandardFields.map((field) => (
              <TableHead key={field.code}>{field.label}</TableHead>
            ))}
            {visibleCustomFields.map((field) => (
              <TableHead key={field.id}>{field.label}</TableHead>
            ))}
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              {visibleStandardFields.map((field) => (
                <TableCell key={field.code}>{field.render(record)}</TableCell>
              ))}
              {visibleCustomFields.map((field) => {
                const value = record.customFields?.[field.code];
                let displayValue: string = '-';

                if (value !== null && value !== undefined) {
                  if (typeof value === 'boolean') {
                    displayValue = value ? 'Yes' : 'No';
                  } else if (value instanceof Date) {
                    displayValue = value.toISOString().split('T')[0];
                  } else {
                    displayValue = String(value);
                  }
                }

                return <TableCell key={field.id}>{displayValue}</TableCell>;
              })}
              {showActions && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onEdit && (
                      <TableActions item={record} onEdit={onEdit} />
                    )}
                    {onReverse && canReverse && !record.isReversed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReverse(record)}
                        className="h-8 w-8 p-0"
                        title="Reverse Payment"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

