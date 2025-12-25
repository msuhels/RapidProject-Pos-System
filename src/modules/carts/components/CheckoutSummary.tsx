'use client';

import { useState, useEffect } from 'react';
import { Edit2, Trash2, CreditCard, ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { toast } from 'sonner';
import type { Cart } from '../types';
import type { Product } from '../../products/types';

interface CheckoutItem extends Cart {
  product?: Product;
  originalPrice: number;
  discountAmount: number;
  discountedPrice: number;
  taxAmount: number;
  finalPrice: number;
}

interface CheckoutSummaryProps {
  carts: Cart[];
  onBack: () => void;
  onComplete: () => void;
}

export function CheckoutSummary({ carts, onBack, onComplete }: CheckoutSummaryProps) {
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'other'>('card');

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const enrichedItems: CheckoutItem[] = await Promise.all(
          carts.map(async (cart) => {
            // Fetch product details
            const productRes = await fetch(`/api/products/${cart.productId}`);
            const productJson = await productRes.json();
            const product: Product = productJson.success ? productJson.data : null;

            if (!product) {
              return null;
            }

            const basePrice = parseFloat(product.price || '0');
            const quantity = parseFloat(cart.quantity || '1');
            const discountType = product.discountType || 'amount';
            const discountValue = parseFloat(product.discountValue || '0');
            const taxRate = parseFloat(product.taxRate || '0');

            // Calculate discount
            let discountAmount = 0;
            if (discountType === 'percentage') {
              discountAmount = basePrice * (discountValue / 100);
            } else {
              discountAmount = discountValue;
            }

            const discountedPrice = Math.max(0, basePrice - discountAmount);
            const taxAmount = discountedPrice * (taxRate / 100);
            const finalPrice = discountedPrice + taxAmount;

            return {
              ...cart,
              product,
              originalPrice: basePrice * quantity,
              discountAmount: discountAmount * quantity,
              discountedPrice: discountedPrice * quantity,
              taxAmount: taxAmount * quantity,
              finalPrice: finalPrice * quantity,
            };
          })
        );

        setItems(enrichedItems.filter(Boolean) as CheckoutItem[]);
      } catch (error) {
        console.error('Error fetching product details:', error);
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (carts.length > 0) {
      fetchProductDetails();
    }
  }, [carts]);

  const updateItemQuantity = async (itemId: string, newQuantity: string) => {
    const qty = parseInt(newQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    try {
      const res = await fetch(`/api/carts/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update quantity');
      }

      // Update local state
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            const quantity = parseFloat(newQuantity);
            const basePrice = parseFloat(item.product?.price || '0');
            const discountType = item.product?.discountType || 'amount';
            const discountValue = parseFloat(item.product?.discountValue || '0');
            const taxRate = parseFloat(item.product?.taxRate || '0');

            let discountAmount = 0;
            if (discountType === 'percentage') {
              discountAmount = basePrice * (discountValue / 100);
            } else {
              discountAmount = discountValue;
            }

            const discountedPrice = Math.max(0, basePrice - discountAmount);
            const taxAmount = discountedPrice * (taxRate / 100);
            const finalPrice = discountedPrice + taxAmount;

            return {
              ...item,
              quantity: newQuantity,
              originalPrice: basePrice * quantity,
              discountAmount: discountAmount * quantity,
              discountedPrice: discountedPrice * quantity,
              taxAmount: taxAmount * quantity,
              finalPrice: finalPrice * quantity,
            };
          }
          return item;
        })
      );

      setEditingItem(null);
      toast.success('Quantity updated');
      onComplete(); // Refresh cart
    } catch (error) {
      console.error('Update quantity error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update quantity');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/carts/${itemId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to remove item');
      }

      setItems((prev) => prev.filter((item) => item.id !== itemId));
      toast.success('Item removed from cart');
      onComplete(); // Refresh cart
    } catch (error) {
      console.error('Remove item error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove item');
    }
  };

  const handlePayment = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setProcessingPayment(true);
    try {
      // Process dummy payment
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate payment processing

      // Create order
      const res = await fetch('/api/carts/checkout', { method: 'POST' });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to process payment');
      }

      toast.success('Payment processed successfully! Order created.');
      onComplete(); // Refresh and go back
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.originalPrice, 0);
  const totalDiscount = items.reduce((sum, item) => sum + item.discountAmount, 0);
  const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0);
  const grandTotal = items.reduce((sum, item) => sum + item.finalPrice, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading checkout summary...</p>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">Your cart is empty</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Checkout Summary</CardTitle>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Original Price</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>After Discount</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Final Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.productName || item.product?.name || 'Unknown Product'}
                    </TableCell>
                    <TableCell>${item.originalPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-orange-600">
                      {item.discountAmount > 0 ? `-$${item.discountAmount.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>${item.discountedPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-blue-600">
                      {item.taxAmount > 0 ? `+$${item.taxAmount.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ${item.finalPrice.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {editingItem === item.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            className="w-20"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => updateItemQuantity(item.id, editQuantity)}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingItem(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <span>{item.quantity}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingItem !== item.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingItem(item.id);
                              setEditQuantity(item.quantity);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-orange-600">
                  <span>Total Discount:</span>
                  <span>-${totalDiscount.toFixed(2)}</span>
                </div>
              )}
              {totalTax > 0 && (
                <div className="flex justify-between text-sm text-blue-600">
                  <span>Total Tax:</span>
                  <span>+${totalTax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Grand Total:</span>
                <span className="text-green-600">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              variant={paymentMethod === 'card' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('card')}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Credit/Debit Card
            </Button>
            <Button
              variant={paymentMethod === 'cash' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('cash')}
            >
              Cash
            </Button>
            <Button
              variant={paymentMethod === 'other' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('other')}
            >
              Other
            </Button>
          </div>

          <div className="pt-4">
            <Button
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
              onClick={handlePayment}
              disabled={processingPayment}
            >
              {processingPayment ? (
                <>Processing Payment...</>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Process Payment (Dummy)
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              This is a dummy payment. No actual charge will be made.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

