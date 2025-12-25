'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { Plus, RefreshCcw, Download, Upload, Tag, X } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Select } from '@/core/components/ui/select';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';
import { usePermissions } from '@/core/hooks/usePermissions';
import { useDebounce } from '@/core/hooks/useDebounce';
import { useAuthStore } from '@/core/store/authStore';
import type { Product, CreateProductInput } from '../types';
import { ProductForm } from '../components/ProductForm';
import { ProductTable } from '../components/ProductTable';
import { ProductLabelsDialog } from '../components/ProductLabelsDialog';
import { useProductLabels } from '../hooks/useProductLabels';

const defaultForm: CreateProductInput = {
  name: '',
  price: '',
  quantity: '',
  image: '',
  category: '',
  sku: '',
  location: '',
  status: 'in_stock',
  labelIds: [],
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [labelsDialogOpen, setLabelsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateProductInput>(defaultForm);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { hasPermission } = usePermissions();
  const debouncedSearch = useDebounce(search, 500);
  const { labels } = useProductLabels();
  const { user } = useAuthStore();

  const canCreate = hasPermission('products:create') || hasPermission('products:*');
  const canUpdate = hasPermission('products:update') || hasPermission('products:*');
  const canDelete = hasPermission('products:delete') || hasPermission('products:*');
  const canExport = hasPermission('products:export') || hasPermission('products:*');
  const canImport = hasPermission('products:import') || hasPermission('products:*');
  const canDuplicate = hasPermission('products:duplicate') || hasPermission('products:*');
  const canManageLabels = hasPermission('products:manage_labels') || hasPermission('products:*');
  
  // Check if user is Super Admin (has admin:* permission)
  const isSuperAdmin = hasPermission('admin:*');
  
  // Add to Cart button should NOT show for Super Admin users
  const canAddToCart = !isSuperAdmin && (hasPermission('carts:create') || hasPermission('carts:*'));

  const showActions = canUpdate || canDelete || canDuplicate;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (category !== 'all') params.set('category', category);

      const query = params.toString();
      const url = query ? `/api/products?${query}` : '/api/products';

      const res = await fetch(url);
      const json = await res.json();

      if (res.ok && json.success) {
        setProducts(json.data ?? []);
      } else {
        toast.error(json.error || 'Failed to load products');
      }
    } catch (error) {
      console.error('Products fetch error:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const openCreate = () => {
    if (!canCreate) {
      toast.error('You do not have permission to create products');
      return;
    }
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update products');
      return;
    }
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      image: product.image || '',
      category: product.category || '',
      sku: product.sku || '',
      location: product.location || '',
      status: product.status || 'in_stock',
      labelIds: product.labelIds || [],
    });
    setDialogOpen(true);
  };

  const saveProduct = async () => {
    if (editingId && !canUpdate) {
      toast.error('You do not have permission to update products');
      return;
    }
    if (!editingId && !canCreate) {
      toast.error('You do not have permission to create products');
      return;
    }

    if (!form.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!form.price.trim()) {
      toast.error('Price is required');
      return;
    }
    if (!form.quantity.trim()) {
      toast.error('Quantity is required');
      return;
    }

    setSaving(true);
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/products/${editingId}` : '/api/products';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save product');
      }

      setDialogOpen(false);
      resetForm();
      fetchProducts();
      toast.success(editingId ? 'Product updated' : 'Product created');
    } catch (error) {
      console.error('Product save error:', error);
      const message = error instanceof Error ? error.message : 'Failed to save product';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product: Product) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete products');
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to delete product');
        }
        await fetchProducts();
      })(),
      {
        loading: 'Deleting product...',
        success: 'Product deleted successfully',
        error: (err) => (err instanceof Error ? err.message : 'Failed to delete product'),
      },
    );
  };

  const duplicateProduct = async (product: Product) => {
    if (!canDuplicate) {
      toast.error('You do not have permission to duplicate products');
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/products/${product.id}/duplicate`, { method: 'POST' });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to duplicate product');
        }
        await fetchProducts();
      })(),
      {
        loading: 'Duplicating product...',
        success: 'Product duplicated successfully',
        error: (err) => (err instanceof Error ? err.message : 'Failed to duplicate product'),
      },
    );
  };

  const archiveProduct = async (product: Product) => {
    if (!isSuperAdmin) {
      toast.error('You do not have permission to archive products');
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/products/${product.id}/archive`, { method: 'POST' });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to archive product');
        }
        await fetchProducts();
      })(),
      {
        loading: 'Archiving product...',
        success: 'Product archived successfully',
        error: (err) => (err instanceof Error ? err.message : 'Failed to archive product'),
      },
    );
  };

  const unarchiveProduct = async (product: Product) => {
    if (!isSuperAdmin) {
      toast.error('You do not have permission to unarchive products');
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/products/${product.id}/unarchive`, { method: 'POST' });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to unarchive product');
        }
        await fetchProducts();
      })(),
      {
        loading: 'Unarchiving product...',
        success: 'Product unarchived successfully',
        error: (err) => (err instanceof Error ? err.message : 'Failed to unarchive product'),
      },
    );
  };

  const handleExport = async () => {
    if (!canExport) {
      toast.error('You do not have permission to export products');
      return;
    }

    try {
      const res = await fetch('/api/products/export');
      if (!res.ok) {
        throw new Error('Failed to export products');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Products exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export products');
    }
  };

  const handleImport = async (file: File) => {
    if (!canImport) {
      toast.error('You do not have permission to import products');
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV file must have headers and at least one row');
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header.toLowerCase()] = values[index] || '';
        });
        return row;
      });

      const productsData = rows.map((row) => ({
        name: row.name || '',
        price: row.price || '',
        quantity: row.quantity || '',
        image: row.image || '',
        category: row.category || '',
      }));

      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: productsData }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to import products');
      }

      toast.success(`Imported ${json.data.success} product(s) successfully`);
      if (json.data.failed > 0) {
        toast.warning(`${json.data.failed} product(s) failed to import`);
      }
      fetchProducts();
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import products');
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const getLabelById = (labelId: string) => labels.find((l) => l.id === labelId);

  const toggleLabel = (labelId: string) => {
    const currentIds = form.labelIds || [];
    if (currentIds.includes(labelId)) {
      setForm({ ...form, labelIds: currentIds.filter((id) => id !== labelId) });
    } else {
      setForm({ ...form, labelIds: [...currentIds, labelId] });
    }
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
  };

  const hasActiveFilters = search || category !== 'all';

  const [addToCartDialogOpen, setAddToCartDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartQuantity, setCartQuantity] = useState('1');
  const [addingToCart, setAddingToCart] = useState(false);

  const handleAddToCart = (product: Product) => {
    if (!user?.id) {
      toast.error('You must be logged in to add items to cart');
      return;
    }
    setSelectedProduct(product);
    setCartQuantity('1');
    setAddToCartDialogOpen(true);
  };

  const confirmAddToCart = async () => {
    if (!selectedProduct || !user?.id) {
      toast.error('Missing product or user information');
      return;
    }

    const requestedQty = parseInt(cartQuantity);
    if (!cartQuantity.trim() || isNaN(requestedQty) || requestedQty <= 0) {
      toast.error('Please enter a valid quantity greater than 0');
      return;
    }

    const availableQty = parseInt(selectedProduct.quantity) || 0;
    if (requestedQty > availableQty) {
      toast.error(`Insufficient stock. Available quantity: ${availableQty}`);
      return;
    }

    setAddingToCart(true);
    try {
      const res = await fetch('/api/carts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: cartQuantity.trim(),
          userId: user.id,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to add product to cart');
      }

      toast.success('Product added to cart successfully');
      setAddToCartDialogOpen(false);
      setSelectedProduct(null);
      setCartQuantity('1');
    } catch (error) {
      console.error('Add to cart error:', error);
      const message = error instanceof Error ? error.message : 'Failed to add product to cart';
      toast.error(message);
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <ProtectedPage permission="products:read" title="Products" description="Manage your products">
      <div className="w-full px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-2xl font-bold">Products</CardTitle>
            <div className="flex gap-2">
              {canManageLabels && (
                <Button variant="outline" size="sm" onClick={() => setLabelsDialogOpen(true)}>
                  <Tag className="h-4 w-4 mr-2" />
                  Manage Labels
                </Button>
              )}
              {canExport && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              {canImport && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImport(file);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </>
              )}
              {canCreate && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={fetchProducts}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1 max-w-md">
                  <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...categories.map((cat) => ({ value: cat!, label: cat! })),
                  ]}
                  className="w-[180px]"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
                  <ProductTable
                    products={products}
                    onEdit={canUpdate ? openEdit : undefined}
                    onDelete={canDelete ? deleteProduct : undefined}
                    onDuplicate={canDuplicate ? duplicateProduct : undefined}
                    onAddToCart={canAddToCart ? handleAddToCart : undefined}
                    onArchive={isSuperAdmin ? archiveProduct : undefined}
                    onUnarchive={isSuperAdmin ? unarchiveProduct : undefined}
                    showActions={showActions}
                    canAddToCart={canAddToCart}
                  />
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Product' : 'New Product'}</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4 space-y-4">
              <ProductForm form={form} onChange={setForm} />
              {labels.length > 0 && (
                <div className="space-y-2">
                  <Label>Labels</Label>
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label) => {
                      const isSelected = form.labelIds?.includes(label.id);
                      return (
                        <button
                          key={label.id}
                          type="button"
                          onClick={() => toggleLabel(label.id)}
                          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-border hover:bg-accent'
                          }`}
                          style={isSelected ? { borderColor: label.color } : {}}
                        >
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: label.color }}
                          />
                          {label.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveProduct} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ProductLabelsDialog open={labelsDialogOpen} onOpenChange={setLabelsDialogOpen} />

        <Dialog open={addToCartDialogOpen} onOpenChange={setAddToCartDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add to Cart</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4 space-y-4">
              {selectedProduct && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Product:</span> {selectedProduct.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Price:</span> {selectedProduct.price}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Available Quantity:</span> {selectedProduct.quantity}
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="cart-quantity">Quantity</Label>
                    <Input
                      id="cart-quantity"
                      type="number"
                      min="1"
                      max={selectedProduct.quantity}
                      value={cartQuantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        const maxQty = parseInt(selectedProduct.quantity) || 0;
                        if (val === '' || parseInt(val) <= maxQty) {
                          setCartQuantity(val);
                        }
                      }}
                      placeholder="Enter quantity"
                    />
                    {parseInt(cartQuantity) > (parseInt(selectedProduct.quantity) || 0) && (
                      <p className="text-sm text-destructive">
                        Quantity cannot exceed available stock ({selectedProduct.quantity})
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAddToCartDialogOpen(false);
                  setSelectedProduct(null);
                  setCartQuantity('1');
                }}
                disabled={addingToCart}
              >
                Cancel
              </Button>
              <Button onClick={confirmAddToCart} disabled={addingToCart}>
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedPage>
  );
}

