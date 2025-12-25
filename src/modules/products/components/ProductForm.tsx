'use client';

import React from 'react';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Select } from '@/core/components/ui/select';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import { Info, DollarSign, Percent, Package, Tag, Image as ImageIcon, MapPin } from 'lucide-react';
import type { CreateProductInput } from '../types';

interface ProductFormProps {
  form: CreateProductInput;
  onChange: (form: CreateProductInput) => void;
}

const STATUS_OPTIONS = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

const STANDARD_FIELD_CONFIG = [
  { code: 'name', label: 'Product Name', type: 'text' as const },
  { code: 'price', label: 'Base Price', type: 'number' as const },
  { code: 'discountType', label: 'Discount Type', type: 'select' as const },
  { code: 'discountValue', label: 'Discount Value', type: 'number' as const },
  { code: 'taxRate', label: 'Tax Rate (%)', type: 'number' as const },
  { code: 'costPrice', label: 'Cost Price', type: 'number' as const },
  { code: 'sellingPrice', label: 'Selling Price', type: 'number' as const },
  { code: 'quantity', label: 'Current Stock Quantity', type: 'number' as const },
  { code: 'minimumStockQuantity', label: 'Minimum Stock Quantity', type: 'number' as const },
  { code: 'image', label: 'Image URL', type: 'url' as const },
  { code: 'category', label: 'Category', type: 'text' as const },
  { code: 'sku', label: 'SKU / Barcode', type: 'text' as const },
  { code: 'location', label: 'Location', type: 'text' as const },
  { code: 'status', label: 'Status', type: 'select' as const },
] as const;

export function ProductForm({ form, onChange }: ProductFormProps) {
  const { isFieldVisible, isFieldEditable, loading: loadingPerms } =
    useFieldPermissions('products');

  const calculateSellingPrice = (
    price: string,
    taxRate: string,
    discountType: string,
    discountValue: string
  ): string => {
    const p = parseFloat(price) || 0;
    const t = parseFloat(taxRate) || 0;
    const dVal = parseFloat(discountValue) || 0;

    // If no price, return 0
    if (p === 0) return '0.00';

    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = p * (dVal / 100);
    } else {
      discountAmount = dVal;
    }

    const discountedPrice = Math.max(0, p - discountAmount);
    const taxAmount = discountedPrice * (t / 100);
    const finalPrice = discountedPrice + taxAmount;

    return finalPrice.toFixed(2);
  };

  // Calculate selling price on initial load if not already set
  React.useEffect(() => {
    if ((form.price || form.taxRate || form.discountValue) && !form.sellingPrice) {
      const calculatedSellingPrice = calculateSellingPrice(
        form.price || '0',
        form.taxRate || '0',
        form.discountType || 'amount',
        form.discountValue || '0'
      );
      
      if (calculatedSellingPrice !== '0.00') {
        onChange({
          ...form,
          sellingPrice: calculatedSellingPrice,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const updateField = <K extends keyof CreateProductInput>(
    key: K,
    value: CreateProductInput[K],
  ) => {
    const newForm = { ...form, [key]: value };

    // Auto-calculate selling price if relevant fields change
    if (['price', 'taxRate', 'discountType', 'discountValue'].includes(key as string)) {
      const sellingPrice = calculateSellingPrice(
        newForm.price || '0',
        newForm.taxRate || '0',
        newForm.discountType || 'amount',
        newForm.discountValue || '0'
      );
      newForm.sellingPrice = sellingPrice;
    }

    onChange(newForm);
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
    isFieldVisible('products', field.code),
  );

  // Group fields into logical sections
  const pricingFields = ['price', 'discountType', 'discountValue', 'taxRate', 'costPrice', 'sellingPrice'];
  const inventoryFields = ['quantity', 'minimumStockQuantity', 'status'];
  const otherFields = visibleFields.filter(f => 
    !pricingFields.includes(f.code) && !inventoryFields.includes(f.code)
  );
  
  const pricingFieldsOrdered = pricingFields
    .map(code => visibleFields.find(f => f.code === code))
    .filter(Boolean) as typeof visibleFields;
  
  const inventoryFieldsOrdered = inventoryFields
    .map(code => visibleFields.find(f => f.code === code))
    .filter(Boolean) as typeof visibleFields;

  return (
    <div className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-border/50">
          <div className="p-2 rounded-lg bg-primary/10">
            <Tag className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Basic Information</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Start with the product name</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {visibleFields.filter(f => f.code === 'name').map((field) => {
            const value = (form as any)[field.code] ?? '';
            const editable = isFieldEditable('products', field.code);
            return (
              <div key={field.code}>
                <Label className="text-sm font-medium mb-2 block">{field.label}</Label>
                <Input
                  type="text"
                  value={value}
                  onChange={(e) =>
                    updateField(field.code as keyof CreateProductInput, e.target.value)
                  }
                  disabled={!editable}
                  placeholder="e.g., Premium Wireless Headphones"
                  className="w-full text-base"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Pricing Information Section - Clear order: Price → Discount → Tax → Cost → Selling */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-border/50">
          <div className="p-2 rounded-lg bg-green-500/10">
            <DollarSign className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Pricing & Discounts</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Set prices, discounts, and tax rates</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pricingFieldsOrdered.map((field) => {
          const value = (form as any)[field.code] ?? '';
          const editable = isFieldEditable('products', field.code);

          if (field.code === 'sellingPrice') {
            // Selling price is calculated, so make it read-only
            const price = parseFloat(form.price || '0') || 0;
            const taxRate = parseFloat(form.taxRate || '0') || 0;
            const discountValue = parseFloat(form.discountValue || '0') || 0;
            const discountType = form.discountType || 'amount';
            
            let discountAmount = 0;
            if (discountType === 'percentage' && price > 0) {
              discountAmount = price * (discountValue / 100);
            } else {
              discountAmount = discountValue;
            }
            const discountedPrice = Math.max(0, price - discountAmount);
            const taxAmount = discountedPrice * (taxRate / 100);
            
            return (
              <div key={field.code} className="md:col-span-3">
                <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  {field.label}
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-normal">
                    <Info className="h-3 w-3" />
                    Auto-calculated
                  </span>
                </Label>
                <div className="mt-2 p-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border-2 border-primary/30 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Final Selling Price</p>
                      <span className="text-3xl font-bold text-primary">${value ? parseFloat(value).toFixed(2) : '0.00'}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-background/80 border border-primary/20">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  {(price > 0 || discountValue > 0 || taxRate > 0) && (
                    <div className="space-y-2.5 pt-4 border-t border-border/50">
                      <div className="flex justify-between items-center text-sm py-1.5 px-2 rounded bg-background/50">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5" />
                          Base Price
                        </span>
                        <span className="font-semibold">${price.toFixed(2)}</span>
                      </div>
                      {discountValue > 0 && (
                        <div className="flex justify-between items-center text-sm py-1.5 px-2 rounded bg-red-50 dark:bg-red-950/20">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Percent className="h-3.5 w-3.5" />
                            Discount ({discountType === 'percentage' ? `${discountValue}%` : `$${discountValue.toFixed(2)}`})
                          </span>
                          <span className="text-red-600 dark:text-red-400 font-semibold">-${discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {taxRate > 0 && (
                        <div className="flex justify-between items-center text-sm py-1.5 px-2 rounded bg-green-50 dark:bg-green-950/20">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Percent className="h-3.5 w-3.5" />
                            Tax ({taxRate}%)
                          </span>
                          <span className="text-green-600 dark:text-green-400 font-semibold">+${taxAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (field.code === 'discountType') {
            return (
              <div key={field.code}>
                <Label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
                  {field.label}
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </Label>
                <Select
                  value={value || 'amount'}
                  onChange={(e) =>
                    updateField(field.code as keyof CreateProductInput, e.target.value as any)
                  }
                  options={[
                    { label: 'Fixed Amount ($)', value: 'amount' },
                    { label: 'Percentage (%)', value: 'percentage' }
                  ]}
                  disabled={!editable}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Choose how to apply the discount
                </p>
              </div>
            );
          }

          if (field.code === 'discountValue') {
            return (
              <div key={field.code}>
                <Label className="text-sm font-medium mb-2 block">
                  {field.label}
                  {form.discountType && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
                      {form.discountType === 'percentage' ? '%' : '$'}
                    </span>
                  )}
                </Label>
                <div className="relative">
                  {form.discountType === 'percentage' ? (
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  ) : (
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  )}
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={value}
                    onChange={(e) =>
                      updateField(field.code as keyof CreateProductInput, e.target.value)
                    }
                    disabled={!editable}
                    placeholder="0.00"
                    className={form.discountType === 'percentage' ? 'pl-9' : 'pl-9'}
                  />
                </div>
                {form.discountType === 'percentage' && parseFloat(value || '0') > 100 && (
                  <p className="text-xs text-amber-600 mt-1.5">Discount cannot exceed 100%</p>
                )}
              </div>
            );
          }

          if (field.code === 'taxRate') {
            return (
              <div key={field.code}>
                <Label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
                  {field.label}
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) =>
                      updateField(field.code as keyof CreateProductInput, e.target.value)
                    }
                    disabled={!editable}
                    placeholder="0.00"
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Tax rate as a percentage (0-100%)
                </p>
              </div>
            );
          }

          if (field.code === 'price') {
            return (
              <div key={field.code}>
                <Label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
                  {field.label}
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={value}
                    onChange={(e) =>
                      updateField(field.code as keyof CreateProductInput, e.target.value)
                    }
                    disabled={!editable}
                    placeholder="0.00"
                    className="pl-9 text-base"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Original price before discounts and tax
                </p>
              </div>
            );
          }

          if (field.code === 'costPrice') {
            return (
              <div key={field.code}>
                <Label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
                  {field.label}
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={value}
                    onChange={(e) =>
                      updateField(field.code as keyof CreateProductInput, e.target.value)
                    }
                    disabled={!editable}
                    placeholder="0.00"
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Your cost price (for profit calculation)
                </p>
              </div>
            );
          }

          return (
            <div key={field.code}>
              <Label>
                {field.label}
                {!editable && (
                  <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                )}
              </Label>
              {field.type === 'select' && field.code === 'status' ? (
                <Select
                  value={value || 'in_stock'}
                  onChange={(e) =>
                    updateField(field.code as keyof CreateProductInput, e.target.value)
                  }
                  options={STATUS_OPTIONS}
                  disabled={!editable}
                  className="w-full"
                />
              ) : (
                <Input
                  type={field.type === 'url' ? 'url' : 'text'}
                  value={value}
                  onChange={(e) =>
                    updateField(field.code as keyof CreateProductInput, e.target.value)
                  }
                  disabled={!editable}
                  placeholder={field.label}
                />
              )}
            </div>
          );
          })}
        </div>
      </div>

      {/* Inventory Management Section */}
      {inventoryFieldsOrdered.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-border/50">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Inventory Management</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Track stock levels and set alerts</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {inventoryFieldsOrdered.map((field) => {
              const value = (form as any)[field.code] ?? '';
              const editable = isFieldEditable('products', field.code);

              if (field.code === 'minimumStockQuantity') {
                const currentQty = parseFloat(form.quantity || '0');
                const minQty = parseFloat(value || '0');
                const isLowStock = currentQty > 0 && currentQty <= minQty;
                
                return (
                  <div key={field.code}>
                    <Label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
                      {field.label}
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={value}
                      onChange={(e) =>
                        updateField(field.code as keyof CreateProductInput, e.target.value)
                      }
                      disabled={!editable}
                      placeholder="10"
                      className={isLowStock ? 'border-amber-300 focus:border-amber-400' : ''}
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Alert when stock falls below this level
                    </p>
                    {isLowStock && (
                      <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Low stock warning active
                      </p>
                    )}
                  </div>
                );
              }

              if (field.code === 'quantity') {
                const currentQty = parseFloat(value || '0');
                const minQty = parseFloat(form.minimumStockQuantity || '10');
                const isLowStock = currentQty > 0 && currentQty <= minQty;
                const isOutOfStock = currentQty === 0;
                
                return (
                  <div key={field.code}>
                    <Label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
                      {field.label}
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={value}
                      onChange={(e) =>
                        updateField(field.code as keyof CreateProductInput, e.target.value)
                      }
                      disabled={!editable}
                      placeholder="0"
                      className={`text-base ${
                        isOutOfStock 
                          ? 'border-red-300 focus:border-red-400' 
                          : isLowStock 
                          ? 'border-amber-300 focus:border-amber-400' 
                          : ''
                      }`}
                    />
                    <div className="mt-1.5 flex items-center gap-2">
                      {isOutOfStock && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                          Out of Stock
                        </span>
                      )}
                      {isLowStock && !isOutOfStock && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400">
                          Low Stock
                        </span>
                      )}
                      {!isLowStock && !isOutOfStock && currentQty > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400">
                          In Stock
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div key={field.code}>
                  <Label className="text-sm font-medium">{field.label}</Label>
                  {field.type === 'select' && field.code === 'status' ? (
                    <Select
                      value={value || 'in_stock'}
                      onChange={(e) =>
                        updateField(field.code as keyof CreateProductInput, e.target.value)
                      }
                      options={STATUS_OPTIONS}
                      disabled={!editable}
                      className="w-full mt-1.5"
                    />
                  ) : (
                    <Input
                      type="number"
                      min="0"
                      value={value}
                      onChange={(e) =>
                        updateField(field.code as keyof CreateProductInput, e.target.value)
                      }
                      disabled={!editable}
                      placeholder="0"
                      className="mt-1.5"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Product Information Section */}
      {otherFields.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-border/50">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <ImageIcon className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Product Details</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Additional product information</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {otherFields.map((field) => {
              const value = (form as any)[field.code] ?? '';
              const editable = isFieldEditable('products', field.code);
              const iconMap: Record<string, React.ReactNode> = {
                image: <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />,
                location: <MapPin className="h-3.5 w-3.5 text-muted-foreground" />,
                category: <Tag className="h-3.5 w-3.5 text-muted-foreground" />,
              };

              return (
                <div key={field.code}>
                  <Label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
                    {field.label}
                    {iconMap[field.code] && iconMap[field.code]}
                  </Label>
                  {field.type === 'select' && field.code === 'status' ? (
                    <>
                      <Select
                        value={value || 'in_stock'}
                        onChange={(e) =>
                          updateField(field.code as keyof CreateProductInput, e.target.value)
                        }
                        options={STATUS_OPTIONS}
                        disabled={!editable}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Current inventory status
                      </p>
                    </>
                  ) : (
                    <>
                      <Input
                        type={field.type === 'url' ? 'url' : 'text'}
                        value={value}
                        onChange={(e) =>
                          updateField(field.code as keyof CreateProductInput, e.target.value)
                        }
                        disabled={!editable}
                        placeholder={
                          field.code === 'image' 
                            ? 'https://example.com/image.jpg' 
                            : field.code === 'sku'
                            ? 'SKU-12345'
                            : field.code === 'category'
                            ? 'Electronics, Clothing, etc.'
                            : field.code === 'location'
                            ? 'Warehouse A, Shelf B3'
                            : field.label
                        }
                      />
                      {field.code === 'image' && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Enter a valid image URL
                        </p>
                      )}
                      {field.code === 'sku' && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Stock keeping unit or barcode
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

