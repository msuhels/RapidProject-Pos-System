'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Button } from '@/core/components/ui/button';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import type { CreateOrderInput, OrderProduct } from '../types';

interface OrderFormProps {
  form: CreateOrderInput;
  onChange: (form: CreateOrderInput) => void;
}

const STANDARD_FIELD_CONFIG = [
  { code: 'userId', label: 'User ID', type: 'text' as const },
  { code: 'orderDate', label: 'Order Date', type: 'date' as const },
] as const;

export function OrderForm({ form, onChange }: OrderFormProps) {
  const { isFieldVisible, isFieldEditable, loading: loadingPerms } =
    useFieldPermissions('orders');

  const updateField = <K extends keyof CreateOrderInput>(
    key: K,
    value: CreateOrderInput[K],
  ) => {
    onChange({ ...form, [key]: value });
  };

  const addProduct = () => {
    const newProduct: OrderProduct = {
      productId: '',
      quantity: '',
      price: '',
    };
    onChange({
      ...form,
      products: [...form.products, newProduct],
    });
  };

  const removeProduct = (index: number) => {
    onChange({
      ...form,
      products: form.products.filter((_, i) => i !== index),
    });
  };

  const updateProduct = (index: number, field: keyof OrderProduct, value: string) => {
    const updatedProducts = [...form.products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: value,
    };
    onChange({
      ...form,
      products: updatedProducts,
    });
  };

  if (loadingPerms) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-10 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const visibleFields = STANDARD_FIELD_CONFIG.filter((field) =>
    isFieldVisible('orders', field.code),
  );

  if (!visibleFields.length && form.products.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No fields available. Contact your administrator for access.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleFields.map((field) => {
          const value = (form as any)[field.code] ?? '';
          const editable = isFieldEditable('orders', field.code);

          return (
            <div key={field.code}>
              <Label>
                {field.label}
                {!editable && (
                  <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                )}
              </Label>
              <Input
                type={field.type}
                value={value}
                onChange={(e) =>
                  updateField(field.code as keyof CreateOrderInput, e.target.value)
                }
                disabled={!editable}
                placeholder={field.label}
              />
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Products</Label>
          <Button type="button" variant="outline" size="sm" onClick={addProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {form.products.map((product, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Product {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeProduct(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Product ID</Label>
                <Input
                  type="text"
                  value={product.productId}
                  onChange={(e) => updateProduct(index, 'productId', e.target.value)}
                  placeholder="Product ID"
                />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="text"
                  value={product.quantity}
                  onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                  placeholder="Quantity"
                />
              </div>
              <div>
                <Label>Price</Label>
                <Input
                  type="text"
                  value={product.price}
                  onChange={(e) => updateProduct(index, 'price', e.target.value)}
                  placeholder="Price"
                />
              </div>
            </div>
          </div>
        ))}

        {form.products.length === 0 && (
          <div className="text-center py-4 text-muted-foreground border rounded-lg">
            No products added. Click "Add Product" to add one.
          </div>
        )}
      </div>
    </div>
  );
}

