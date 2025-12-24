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
import type { Cart } from '../types';

interface CartTableProps {
  carts: Cart[];
  loading?: boolean;
  onEdit?: (cart: Cart) => void;
  onDelete?: (cart: Cart) => void;
  onDuplicate?: (cart: Cart) => void;
  showActions?: boolean;
}

const STANDARD_FIELDS = [
  {
    code: 'product',
    label: 'Product',
    render: (c: Cart) => (
      <div>
        <div className="font-medium">{c.productName || `Product ID: ${c.productId}`}</div>
        {c.productPrice && (
          <div className="text-sm text-muted-foreground">Price: {c.productPrice}</div>
        )}
      </div>
    ),
  },
  { code: 'quantity', label: 'Quantity', render: (c: Cart) => c.quantity },
  { code: 'userId', label: 'User ID', render: (c: Cart) => c.userId },
] as const;

export function CartTable({
  carts,
  loading = false,
  onEdit,
  onDelete,
  onDuplicate,
  showActions = true,
}: CartTableProps) {
  const { isFieldVisible, loading: loadingPerms } = useFieldPermissions('carts');

  if (loading || loadingPerms) {
    return (
      <div className="py-8 text-center text-muted-foreground">Loading carts...</div>
    );
  }

  if (!carts.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">No carts found.</div>
    );
  }

  const visibleFields = STANDARD_FIELDS.filter((field) =>
    isFieldVisible('carts', field.code),
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
          {carts.map((cart) => (
            <TableRow key={cart.id}>
              {visibleFields.map((field) => (
                <TableCell key={field.code}>{field.render(cart)}</TableCell>
              ))}
              {showActions && (
                <TableCell className="text-right">
                  <TableActions
                    item={cart}
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

