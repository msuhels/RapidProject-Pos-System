'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Checkbox } from '@/core/components/ui/checkbox';
import type { PaymentMethod, CreatePaymentMethodInput, UpdatePaymentMethodInput } from '../types';

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method?: PaymentMethod | null;
  onSave: (data: CreatePaymentMethodInput | UpdatePaymentMethodInput) => Promise<void>;
}

export function PaymentMethodDialog({
  open,
  onOpenChange,
  method,
  onSave,
}: PaymentMethodDialogProps) {
  const [form, setForm] = useState<CreatePaymentMethodInput>({
    name: '',
    isActive: true,
    supportsRefund: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (method) {
      setForm({
        name: method.name,
        isActive: method.isActive,
        supportsRefund: method.supportsRefund,
      });
    } else {
      setForm({
        name: '',
        isActive: true,
        supportsRefund: true,
      });
    }
  }, [method, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(form);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving payment method:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{method ? 'Edit Payment Method' : 'Create Payment Method'}</DialogTitle>
          <DialogDescription>
            {method ? 'Update payment method details' : 'Add a new payment method'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g., Cash, Card, UPI"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked as boolean })}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="supportsRefund"
                checked={form.supportsRefund}
                onCheckedChange={(checked) => setForm({ ...form, supportsRefund: checked as boolean })}
              />
              <Label htmlFor="supportsRefund" className="cursor-pointer">
                Supports Refund
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !form.name.trim()}>
              {loading ? 'Saving...' : method ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

