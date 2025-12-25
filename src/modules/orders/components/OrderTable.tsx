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
import type { Order } from '../types';

interface OrderTableProps {
  orders: Order[];
  loading?: boolean;
  onEdit?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  onDuplicate?: (order: Order) => void;
  showActions?: boolean;
}

const STANDARD_FIELDS = [
  {
    code: 'orderDate',
    label: 'Order Date',
    render: (o: Order) => new Date(o.orderDate).toLocaleDateString(),
  },
  {
    code: 'userName',
    label: 'User',
    render: (o: Order) => (
      <div>
        <div className="font-medium">{o.userName || o.userEmail || o.userId}</div>
        {o.userEmail && o.userName && (
          <div className="text-sm text-muted-foreground">{o.userEmail}</div>
        )}
      </div>
    ),
  },
  {
    code: 'products',
    label: 'Products',
    render: (o: Order) => (
      <div>
        <div className="font-medium">{o.products.length} product(s)</div>
        <div className="text-sm text-muted-foreground space-y-1">
          {o.products.slice(0, 3).map((p, i) => (
            <div key={i}>
              {p.productName || 'Unknown'} - Qty: {p.quantity} @ ${p.price}
            </div>
          ))}
          {o.products.length > 3 && (
            <div className="text-xs">+{o.products.length - 3} more product(s)</div>
          )}
        </div>
      </div>
    ),
  },
  {
    code: 'totalAmount',
    label: 'Total Amount',
    render: (o: Order) => `$${o.totalAmount || '0.00'}`,
  },
] as const;

export function OrderTable({
  orders,
  loading = false,
  onEdit,
  onDelete,
  onDuplicate,
  showActions = true,
}: OrderTableProps) {
  const { isFieldVisible, loading: loadingPerms } = useFieldPermissions('orders');

  if (loading || loadingPerms) {
    return (
      <div className="py-8 text-center text-muted-foreground">Loading orders...</div>
    );
  }

  if (!orders.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">No orders found.</div>
    );
  }

  const visibleFields = STANDARD_FIELDS.filter((field) =>
    isFieldVisible('orders', field.code),
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
          {orders.map((order) => (
            <TableRow key={order.id}>
              {visibleFields.map((field) => (
                <TableCell key={field.code}>{field.render(order)}</TableCell>
              ))}
              {showActions && (
                <TableCell className="text-right">
                  <TableActions
                    item={order}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
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

