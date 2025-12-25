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
import { Button } from '@/core/components/ui/button';
import { History } from 'lucide-react';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import { useCustomerCustomFields } from '../hooks/useCustomerCustomFields';
import type { CustomerRecord } from '../types';

interface CustomerTableProps {
  records: CustomerRecord[];
  loading?: boolean;
  onEdit?: (record: CustomerRecord) => void;
  onDelete?: (record: CustomerRecord) => void;
  onViewSalesHistory?: (record: CustomerRecord) => void;
  showActions?: boolean;
}

const STANDARD_FIELDS = [
  { code: 'name', label: 'Name', render: (r: CustomerRecord) => r.name },
  {
    code: 'phone_number',
    label: 'Phone Number',
    render: (r: CustomerRecord) => r.phoneNumber ?? '-',
  },
  {
    code: 'email',
    label: 'Email',
    render: (r: CustomerRecord) => r.email ?? '-',
  },
  {
    code: 'total_purchases',
    label: 'Total Purchases',
    render: (r: CustomerRecord) => r.totalPurchases.toFixed(2),
  },
  {
    code: 'outstanding_balance',
    label: 'Outstanding Balance',
    render: (r: CustomerRecord) => r.outstandingBalance.toFixed(2),
  },
  {
    code: 'is_active',
    label: 'Status',
    render: (r: CustomerRecord) => (
      <span className={r.isActive ? 'text-green-600' : 'text-gray-500'}>
        {r.isActive ? 'Active' : 'Inactive'}
      </span>
    ),
  },
] as const;

export function CustomerTable({
  records,
  loading = false,
  onEdit,
  onDelete,
  onViewSalesHistory,
  showActions = true,
}: CustomerTableProps) {
  const { isFieldVisible, loading: loadingPerms } = useFieldPermissions('customer_management');
  const { customFields } = useCustomerCustomFields();

  if (loading || loadingPerms) {
    return (
      <div className="py-8 text-center text-muted-foreground">Loading records...</div>
    );
  }

  if (!records.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">No records found.</div>
    );
  }

  const visibleStandardFields = STANDARD_FIELDS.filter((field) =>
    isFieldVisible('customer_management', field.code),
  );

  const visibleCustomFields = customFields.filter(
    (field) => field.metadata?.showInTable && isFieldVisible('customer_management', field.code),
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
                  <div className="flex items-center justify-end gap-1">
                    {onViewSalesHistory && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewSalesHistory(record)}
                        title="View Sales/Order History"
                        aria-label="View Sales/Order History"
                        className="hover:bg-primary/10"
                      >
                        <History className="h-4 w-4 text-primary" />
                      </Button>
                    )}
                    <TableActions item={record} onEdit={onEdit} onDelete={onDelete} />
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


