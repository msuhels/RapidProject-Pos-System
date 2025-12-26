'use client';

import React, { useEffect, useState } from 'react';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Select } from '@/core/components/ui/select';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import { Info, DollarSign, Percent, Package, Tag, Image as ImageIcon, MapPin, Truck } from 'lucide-react';
import type { CreateProductInput } from '../types';

interface ProductFormProps {
  form: CreateProductInput;
  onChange: (form: CreateProductInput) => void;
}

interface Supplier {
  id: string;
  supplierName: string;
}

const STANDARD_FIELD_CONFIG = [
  { code: 'name', label: 'Product Name', type: 'text' as const },
  { code: 'price', label: 'Actual Price', type: 'number' as const },
  { code: 'discountType', label: 'Discount Type', type: 'select' as const },
  { code: 'discountValue', label: 'Discount Value', type: 'number' as const },
  { code: 'taxRate', label: 'Tax Rate (%)', type: 'number' as const },
  { code: 'costPrice', label: 'Cost Price', type: 'number' as const },
  { code: 'sellingPrice', label: 'Final Price', type: 'number' as const },
  { code: 'quantity', label: 'Current Stock Quantity', type: 'number' as const },
  { code: 'minimumStockQuantity', label: 'Minimum Stock Quantity (MSQ)', type: 'number' as const },
  { code: 'supplierId', label: 'Supplier', type: 'select' as const },
  { code: 'image', label: 'Image URL', type: 'url' as const },
  { code: 'category', label: 'Category', type: 'text' as const },
  { code: 'sku', label: 'SKU / Barcode', type: 'text' as const },
  { code: 'location', label: 'Location', type: 'text' as const },
] as const;

export function ProductForm({ form, onChange }: ProductFormProps) {
  const { isFieldVisible, isFieldEditable, loading: loadingPerms } =
    useFieldPermissions('products');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // Fetch active suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        const res = await fetch('/api/suppliers?status=active');
        const json = await res.json();
        if (res.ok && json.success) {
          setSuppliers(json.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch suppliers:', error);
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
  }, []);

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

  // Always include MSQ, supplierId, and discount fields even if permissions hide them (they're required/important)
  const visibleFields = STANDARD_FIELD_CONFIG.filter((field) => {
    // Always show MSQ, supplierId, and discount fields
    if (field.code === 'minimumStockQuantity' || 
        field.code === 'supplierId' || 
        field.code === 'discountType' || 
        field.code === 'discountValue') {
      return true;
    }
    return isFieldVisible('products', field.code);
  });

  // Group fields into logical sections
  const pricingFields = ['price', 'discountType', 'discountValue', 'taxRate', 'costPrice', 'sellingPrice'];
  const inventoryFields = ['quantity', 'minimumStockQuantity', 'supplierId'];
  const otherFields = visibleFields.filter(f => 
    !pricingFields.includes(f.code) && !inventoryFields.includes(f.code)
  );
  
  // Ensure discount fields are always included in pricing fields, even if not in visibleFields
  const pricingFieldsOrdered = pricingFields
    .map(code => {
      const found = visibleFields.find(f => f.code === code);
      if (found) return found;
      // If not found in visibleFields, get from STANDARD_FIELD_CONFIG (for discount fields and other pricing fields)
      const fromConfig = STANDARD_FIELD_CONFIG.find(f => f.code === code);
      if (fromConfig) return fromConfig;
      return null;
    })
    .filter(Boolean) as typeof visibleFields;
  
  // Double-check discount fields are included - add them if missing
  const hasDiscountType = pricingFieldsOrdered.some(f => f.code === 'discountType');
  const hasDiscountValue = pricingFieldsOrdered.some(f => f.code === 'discountValue');
  
  if (!hasDiscountType) {
    const discountTypeField = STANDARD_FIELD_CONFIG.find(f => f.code === 'discountType');
    if (discountTypeField) pricingFieldsOrdered.push(discountTypeField);
  }
  if (!hasDiscountValue) {
    const discountValueField = STANDARD_FIELD_CONFIG.find(f => f.code === 'discountValue');
    if (discountValueField) pricingFieldsOrdered.push(discountValueField);
  }
  
  // Ensure MSQ and supplierId are always included in inventory fields, even if not in visibleFields
  const inventoryFieldsOrdered = inventoryFields
    .map(code => {
      const found = visibleFields.find(f => f.code === code);
      if (found) return found;
      // If not found in visibleFields, get from STANDARD_FIELD_CONFIG (for MSQ and supplierId)
      if (code === 'minimumStockQuantity' || code === 'supplierId') {
        return STANDARD_FIELD_CONFIG.find(f => f.code === code);
      }
      return null;
    })
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
          // Always allow editing discount fields regardless of permissions
          const editable = (field.code === 'discountType' || field.code === 'discountValue') 
            ? true 
            : isFieldEditable('products', field.code);

          if (field.code === 'sellingPrice') {
            // Final price is calculated, so make it read-only
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
                <div className="mt-2 p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Final Price:</span>
                    <span className="text-xl font-bold text-foreground">${value ? parseFloat(value).toFixed(2) : '0.00'}</span>
                  </div>
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
                  onChange={(e) => {
                    const newValue = e.target.value as 'amount' | 'percentage';
                    updateField(field.code as keyof CreateProductInput, newValue);
                  }}
                  options={[
                    { label: 'Fixed Amount ($)', value: 'amount' },
                    { label: 'Percentage (%)', value: 'percentage' }
                  ]}
                  disabled={!editable}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Choose how to apply the discount - Fixed Amount or Percentage
                </p>
              </div>
            );
          }

          if (field.code === 'discountValue') {
            const maxValue = form.discountType === 'percentage' ? 100 : undefined;
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
                    step={form.discountType === 'percentage' ? '0.1' : '0.01'}
                    min="0"
                    max={maxValue}
                    value={value}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      // Allow empty input for clearing
                      if (inputValue === '') {
                        updateField(field.code as keyof CreateProductInput, '');
                        return;
                      }
                      // Validate percentage doesn't exceed 100
                      if (form.discountType === 'percentage') {
                        const numValue = parseFloat(inputValue);
                        if (!isNaN(numValue) && numValue <= 100) {
                          updateField(field.code as keyof CreateProductInput, inputValue);
                        }
                      } else {
                        updateField(field.code as keyof CreateProductInput, inputValue);
                      }
                    }}
                    disabled={!editable}
                    placeholder={form.discountType === 'percentage' ? '0.0' : '0.00'}
                    className="pl-9"
                  />
                </div>
                {form.discountType === 'percentage' ? (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Enter discount percentage (0-100%)
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Enter discount amount in dollars
                  </p>
                )}
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
              <Input
                type={field.type === 'url' ? 'url' : 'text'}
                value={value}
                onChange={(e) =>
                  updateField(field.code as keyof CreateProductInput, e.target.value)
                }
                disabled={!editable}
                placeholder={field.label}
              />
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
              // Always allow editing MSQ and supplier fields regardless of permissions
              const editable = (field.code === 'minimumStockQuantity' || field.code === 'supplierId')
                ? true
                : isFieldEditable('products', field.code);

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
                      step="1"
                      required
                      value={value}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        // Allow empty input for clearing, but validate it's a number
                        if (inputValue === '' || (!isNaN(parseFloat(inputValue)) && parseFloat(inputValue) >= 0)) {
                          updateField(field.code as keyof CreateProductInput, inputValue);
                        }
                      }}
                      disabled={!editable}
                      placeholder="Enter minimum stock quantity"
                      className={isLowStock ? 'border-amber-300 focus:border-amber-400' : ''}
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      <span className="font-semibold text-foreground">Required:</span> Enter the minimum stock quantity manually. Alert when stock falls below this level
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
                const minQty = parseFloat(form.minimumStockQuantity || '0');
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

              if (field.code === 'supplierId') {
                return (
                  <div key={field.code}>
                    <Label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
                      {field.label}
                      <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                    </Label>
                    <Select
                      value={value || ''}
                      onChange={(e) => {
                        const selectedValue = e.target.value;
                        updateField(field.code as keyof CreateProductInput, selectedValue || undefined);
                      }}
                      options={[
                        { label: 'Select Supplier (Optional)', value: '' },
                        ...suppliers.map(s => ({ label: s.supplierName, value: s.id }))
                      ]}
                      disabled={!editable || loadingSuppliers}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {loadingSuppliers ? 'Loading suppliers from supplier module...' : suppliers.length > 0 
                        ? `Select from ${suppliers.length} active supplier(s) from supplier module` 
                        : 'No active suppliers available. Create suppliers in the supplier module first.'}
                    </p>
                  </div>
                );
              }

              return (
                <div key={field.code}>
                  <Label className="text-sm font-medium">{field.label}</Label>
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
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

