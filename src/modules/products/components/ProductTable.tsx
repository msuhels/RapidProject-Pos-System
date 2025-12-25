'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Button } from '@/core/components/ui/button';
import { ShoppingCart, Archive, ArchiveRestore } from 'lucide-react';
import { TableActions } from '@/core/components/common/TableActions';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import { usePermissions } from '@/core/hooks/usePermissions';
import type { Product } from '../types';

interface ProductTableProps {
  products: Product[];
  loading?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onDuplicate?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onArchive?: (product: Product) => void;
  onUnarchive?: (product: Product) => void;
  showActions?: boolean;
  canAddToCart?: boolean;
}

const STANDARD_FIELDS = [
  { 
    code: 'image', 
    label: 'Image', 
    render: (p: Product) => {
      if (!p.image) {
        return <span className="text-muted-foreground text-xs">No image</span>;
      }
      return (
        <div className="relative">
          <img 
            src={p.image} 
            alt={p.name}
            className="w-12 h-12 object-cover rounded border"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.style.display = 'block';
              }
            }}
          />
          <span className="hidden text-muted-foreground text-xs">Failed to load</span>
        </div>
      );
    }
  },
  { code: 'name', label: 'Name', render: (p: Product) => p.name },
  { code: 'price', label: 'Price', render: (p: Product) => p.price },
  { code: 'quantity', label: 'Quantity', render: (p: Product) => p.quantity, superAdminOnly: true },
  { code: 'category', label: 'Category', render: (p: Product) => p.category || '-' },
  { code: 'costPrice', label: 'Cost Price', render: (p: Product) => p.costPrice || '-' },
  { code: 'sellingPrice', label: 'Selling Price', render: (p: Product) => p.sellingPrice || '-' },
  { code: 'taxRate', label: 'Tax Rate', render: (p: Product) => p.taxRate || '-' },
  { code: 'location', label: 'Location', render: (p: Product) => p.location || '-' },
  { code: 'status', label: 'Status', render: (p: Product) => p.status || '-' },
  { code: 'createdAt', label: 'Created At', render: (p: Product) => p.createdAt || '-' },
  { code: 'updatedAt', label: 'Updated At', render: (p: Product) => p.updatedAt || '-' },
  { code: 'createdBy', label: 'Created By', render: (p: Product) => p.createdBy || '-' },
  { code: 'updatedBy', label: 'Updated By', render: (p: Product) => p.updatedBy || '-' },
  { code: 'deletedAt', label: 'Deleted At', render: (p: Product) => p.deletedAt || '-' },
] as const;

export function ProductTable({
  products,
  loading = false,
  onEdit,
  onDelete,
  onDuplicate,
  onAddToCart,
  onArchive,
  onUnarchive,
  showActions = true,
  canAddToCart = false,
}: ProductTableProps) {
  const { isFieldVisible, loading: loadingPerms } = useFieldPermissions('products');
  const { hasPermission } = usePermissions();
  
  // Check if user is Super Admin (has admin:* permission)
  // Super Admins have admin:* permission which grants all permissions
  const isSuperAdmin = hasPermission('admin:*');

  if (loading || loadingPerms) {
    return (
      <div className="py-8 text-center text-muted-foreground">Loading products...</div>
    );
  }

  if (!products.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">No products found.</div>
    );
  }

  const visibleFields = STANDARD_FIELDS.filter((field) => {
    // Check field-level permissions first
    if (!isFieldVisible('products', field.code)) {
      return false;
    }
    
    // Filter by Super Admin status - quantity field only for Super Admins
    if ((field as any).superAdminOnly && !isSuperAdmin) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleFields.map((field) => (
              <TableHead key={field.code}>{field.label}</TableHead>
            ))}
            {(showActions || canAddToCart) && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              {visibleFields.map((field) => (
                <TableCell key={field.code}>{field.render(product)}</TableCell>
              ))}
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {canAddToCart && !isSuperAdmin && onAddToCart && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAddToCart(product)}
                      className="h-8"
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Add to Cart
                    </Button>
                  )}
                  {isSuperAdmin && (
                    <>
                      {product.archivedAt ? (
                        onUnarchive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onUnarchive(product)}
                            title="Unarchive"
                            aria-label="Unarchive"
                          >
                            <ArchiveRestore className="h-4 w-4" />
                          </Button>
                        )
                      ) : (
                        onArchive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onArchive(product)}
                            title="Archive"
                            aria-label="Archive"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )
                      )}
                    </>
                  )}
                  {showActions && (
                    <TableActions
                      item={product}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

