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
import { useSupplierCustomFields } from '../hooks/useSupplierCustomFields';
import type { SupplierRecord } from '../types';

interface SupplierTableProps {
  records: SupplierRecord[];
  loading?: boolean;
  onEdit?: (record: SupplierRecord) => void;
  onDelete?: (record: SupplierRecord) => void;
  showActions?: boolean;
}

const STANDARD_FIELDS = [
  { code: 'supplier_code', label: 'Supplier Code', render: (r: SupplierRecord) => r.supplierCode },
  { code: 'supplier_name', label: 'Supplier Name', render: (r: SupplierRecord) => r.supplierName },
  {
    code: 'contact_person',
    label: 'Contact Person',
    render: (r: SupplierRecord) => r.contactPerson ?? '-',
  },
  {
    code: 'email',
    label: 'Email',
    render: (r: SupplierRecord) => r.email ?? '-',
  },
  {
    code: 'phone',
    label: 'Phone',
    render: (r: SupplierRecord) => r.phone ?? '-',
  },
  {
    code: 'address',
    label: 'Address',
    render: (r: SupplierRecord) => r.address ?? '-',
  },
  {
    code: 'status',
    label: 'Status',
    render: (r: SupplierRecord) => (
      <span className={r.status === 'active' ? 'text-green-600' : 'text-gray-500'}>
        {r.status === 'active' ? 'Active' : 'Inactive'}
      </span>
    ),
  },
] as const;

export function SupplierTable({
  records,
  loading = false,
  onEdit,
  onDelete,
  showActions = true,
}: SupplierTableProps) {
  const { isFieldVisible, loading: loadingPerms } = useFieldPermissions('supplier');
  const { customFields } = useSupplierCustomFields();

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
    isFieldVisible('supplier', field.code),
  );

  const visibleCustomFields = customFields.filter(
    (field) => field.metadata?.showInTable && isFieldVisible('supplier', field.code),
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
                  <TableActions item={record} onEdit={onEdit} onDelete={onDelete} />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

