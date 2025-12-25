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
import { ShoppingCart, Archive, ArchiveRestore, Tag, Percent, DollarSign } from 'lucide-react';
import { TableActions } from '@/core/components/common/TableActions';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import { usePermissions } from '@/core/hooks/usePermissions';
import { ProductCard } from './ProductCard';
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
    code: 'name', 
    label: 'Product', 
    render: (p: Product) => (
      <div className="flex items-center gap-4 min-w-[250px]">
        {p.image ? (
          <img
            src={p.image}
            alt={p.name}
            className="w-16 h-16 object-cover rounded-xl border-2 border-border"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-16 h-16 rounded-xl border-2 border-border bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <Tag className="h-7 w-7 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base text-foreground truncate">{p.name}</div>
          {p.category && (
            <div className="text-xs text-muted-foreground mt-1 font-medium">{p.category}</div>
          )}
        </div>
      </div>
    )
  },
  { 
    code: 'sellingPrice', 
    label: 'Pricing', 
    render: (p: Product) => {
      const selling = parseFloat(p.sellingPrice || '0');
      const originalPrice = parseFloat(p.price || '0');
      const discountValue = parseFloat(p.discountValue || '0');
      const discountType = p.discountType;
      const taxRate = parseFloat(p.taxRate || '0');
      
      if (isNaN(selling) || selling === 0) {
        return <span className="text-muted-foreground">-</span>;
      }

      // Calculate price after discount (before tax)
      let discountAmount = 0;
      if (discountType === 'percentage' && originalPrice > 0) {
        discountAmount = originalPrice * (discountValue / 100);
      } else {
        discountAmount = discountValue;
      }
      const priceAfterDiscount = Math.max(0, originalPrice - discountAmount);
      const hasDiscount = discountValue > 0;

      return (
        <div className="space-y-3 min-w-[220px]">
          {/* Actual Price */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Actual:</span>
            <span className="text-lg font-bold text-foreground">${originalPrice.toFixed(2)}</span>
          </div>
          
          {/* Before Discount (with strikethrough) */}
          {hasDiscount && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Before Discount:</span>
              <span className="text-xl font-bold text-muted-foreground/70 line-through decoration-2 decoration-red-500">
                ${originalPrice.toFixed(2)}
              </span>
            </div>
          )}
          
          {/* Discount */}
          {hasDiscount && (
            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-2.5 border border-orange-200 dark:border-orange-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Discount:</span>
                <span className="text-lg font-bold text-orange-600">
                  {discountType === 'percentage' ? `${discountValue.toFixed(0)}%` : `$${discountValue.toFixed(2)}`}
                </span>
              </div>
              <div className="text-right mt-1">
                <span className="text-xs text-muted-foreground">Save: </span>
                <span className="text-sm font-bold text-orange-600">${discountAmount.toFixed(2)}</span>
              </div>
            </div>
          )}
          
          {/* Final Selling Price */}
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border-2 border-green-200 dark:border-green-900/50">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs font-bold text-muted-foreground uppercase">Final Price:</span>
              <span className="text-2xl font-black text-green-600 dark:text-green-500">
                ${selling.toFixed(2)}
              </span>
            </div>
            {hasDiscount && (
              <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                <div className="flex justify-between mb-1">
                  <span>After Discount:</span>
                  <span className="font-semibold">${priceAfterDiscount.toFixed(2)}</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({taxRate}%):</span>
                    <span className="font-semibold text-blue-600">+${(selling - priceAfterDiscount).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
  },
  {
    code: 'discount',
    label: 'Discount',
    render: (p: Product) => {
      if (!p.discountValue) return (
        <span className="text-muted-foreground text-sm">-</span>
      );
      const value = parseFloat(p.discountValue);
      if (isNaN(value) || value === 0) return (
        <span className="text-muted-foreground text-sm">-</span>
      );
      
      const originalPrice = parseFloat(p.price || '0');
      let discountAmount = 0;
      if (p.discountType === 'percentage') {
        discountAmount = originalPrice * (value / 100);
      } else {
        discountAmount = value;
      }
      
      return (
        <div className="space-y-1 min-w-[120px]">
          <div className="flex items-center gap-2">
            {p.discountType === 'percentage' ? (
              <Percent className="h-4 w-4 text-orange-600" />
            ) : (
              <DollarSign className="h-4 w-4 text-orange-600" />
            )}
            <span className="text-lg font-bold text-orange-600 dark:text-orange-500">
              {p.discountType === 'percentage' ? `${value.toFixed(0)}%` : `$${value.toFixed(2)}`}
            </span>
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            Save ${discountAmount.toFixed(2)}
          </div>
        </div>
      );
    }
  },
  { 
    code: 'price', 
    label: 'Original Price', 
    render: (p: Product) => {
      const price = parseFloat(p.price || '0');
      if (price === 0) return <span className="text-muted-foreground">-</span>;
      const discountValue = parseFloat(p.discountValue || '0');
      
      return (
        <div>
          {discountValue > 0 ? (
            <span className="line-through text-muted-foreground text-sm">${price.toFixed(2)}</span>
          ) : (
            <span className="font-medium">${price.toFixed(2)}</span>
          )}
        </div>
      );
    }
  },
  { 
    code: 'costPrice', 
    label: 'Cost Price', 
    render: (p: Product) => {
      if (!p.costPrice) return <span className="text-muted-foreground">-</span>;
      const cost = parseFloat(p.costPrice);
      return isNaN(cost) ? '-' : (
        <span className="text-muted-foreground">${cost.toFixed(2)}</span>
      );
    },
    superAdminOnly: true
  },
  { 
    code: 'taxRate', 
    label: 'Tax', 
    render: (p: Product) => {
      if (!p.taxRate) return <span className="text-muted-foreground">No tax</span>;
      const tax = parseFloat(p.taxRate);
      return isNaN(tax) ? '-' : (
        <div className="flex items-center gap-1.5">
          <Percent className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-blue-600 font-medium">{tax.toFixed(1)}%</span>
        </div>
      );
    }
  },
  { 
    code: 'status', 
    label: 'Availability', 
    render: (p: Product) => {
      const statusMap: Record<string, { label: string; className: string }> = {
        in_stock: { label: 'In Stock', className: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400' },
        low_stock: { label: 'Low Stock', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400' },
        out_of_stock: { label: 'Out of Stock', className: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400' },
      };
      const status = statusMap[p.status] || { label: p.status, className: 'bg-gray-100 text-gray-800' };
      return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}>
          {status.label}
        </span>
      );
    }
  },
  { code: 'quantity', label: 'Stock', render: (p: Product) => {
    const qty = parseFloat(p.quantity || '0');
    const minQty = parseFloat(p.minimumStockQuantity || '10');
    const isLow = qty > 0 && qty <= minQty;
    return (
      <div>
        <span className={isLow ? 'text-amber-600 font-medium' : 'font-medium'}>{qty}</span>
        {p.minimumStockQuantity && (
          <div className="text-xs text-muted-foreground">Min: {p.minimumStockQuantity}</div>
        )}
      </div>
    );
  }, superAdminOnly: true },
  { code: 'category', label: 'Category', render: (p: Product) => p.category || <span className="text-muted-foreground">-</span> },
  { code: 'location', label: 'Location', render: (p: Product) => p.location || <span className="text-muted-foreground">-</span>, superAdminOnly: true },
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

  // For user-facing view (canAddToCart), show Flipkart-style clean grid layout
  if (canAddToCart && !isSuperAdmin) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    );
  }

  // Admin/Table view - Enhanced and Clean
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b-2 border-border">
              {visibleFields.map((field) => (
                <TableHead key={field.code} className="font-bold text-sm text-foreground py-4">
                  {field.label}
                </TableHead>
              ))}
              {(showActions || canAddToCart) && (
                <TableHead className="text-right font-bold text-sm text-foreground py-4">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow 
                key={product.id} 
                className="hover:bg-muted/10 transition-colors border-b border-border/30"
              >
                {visibleFields.map((field) => (
                  <TableCell key={field.code} className="py-5 align-top">
                    {field.render(product)}
                  </TableCell>
                ))}
                <TableCell className="text-right py-5 align-top">
                  <div className="flex items-center justify-end gap-2">
                    {canAddToCart && !isSuperAdmin && onAddToCart && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAddToCart(product)}
                        className="h-9 border-primary/30 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                      >
                        <ShoppingCart className="h-4 w-4 mr-1.5" />
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
                              className="h-9 w-9"
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
                              className="h-9 w-9"
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
    </div>
  );
}

