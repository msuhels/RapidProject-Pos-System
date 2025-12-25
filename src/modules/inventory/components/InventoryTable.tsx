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
import type { Product } from '../types';

interface InventoryTableProps {
  inventory: Product[];
  loading?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onDuplicate?: (product: Product) => void;
  showActions?: boolean;
}

const STANDARD_FIELDS = [
  { code: 'name', label: 'Product Name', render: (p: Product) => p.name },
  { code: 'sku', label: 'SKU', render: (p: Product) => p.sku || '-' },
  { code: 'location', label: 'Location', render: (p: Product) => p.location || '-' },
  { code: 'quantity', label: 'Quantity', render: (p: Product) => p.quantity },
  {
    code: 'status',
    label: 'Status',
    render: (p: Product) => {
      const statusMap: Record<string, { label: string; className: string }> = {
        in_stock: { label: 'In Stock', className: 'bg-green-100 text-green-800' },
        low_stock: { label: 'Low Stock', className: 'bg-red-100 text-red-800' },
        out_of_stock: { label: 'Out of Stock', className: 'bg-gray-100 text-gray-800' },
      };
      const status = statusMap[p.status] || { label: p.status, className: 'bg-gray-100 text-gray-800' };
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
          {status.label}
        </span>
      );
    },
  },
  { code: 'price', label: 'Price', render: (p: Product) => p.price },
] as const;

export function InventoryTable({
  inventory,
  loading = false,
  onEdit,
  onDelete,
  onDuplicate,
  showActions = true,
}: InventoryTableProps) {
  const { isFieldVisible, loading: loadingPerms } = useFieldPermissions('inventory');

  if (loading || loadingPerms) {
    return (
      <div className="py-8 text-center text-muted-foreground">Loading inventory...</div>
    );
  }

  if (!inventory.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">No inventory found.</div>
    );
  }

  const visibleFields = STANDARD_FIELDS.filter((field) =>
    isFieldVisible('inventory', field.code),
  );

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleFields.map((field) => (
              <TableHead key={field.code}>{field.label}</TableHead>
            ))}
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.map((item) => {
            const isLowStock = item.status === 'low_stock';
            return (
              <TableRow
                key={item.id}
                className={
                  isLowStock
                    ? 'border-l-4 border-l-red-500'
                    : ''
                }
              >
                {visibleFields.map((field) => (
                  <TableCell key={field.code}>{field.render(item)}</TableCell>
                ))}
                {showActions && (
                  <TableCell className="text-right">
                    <TableActions
                      item={item}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                    />
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
