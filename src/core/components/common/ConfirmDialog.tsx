'use client';

import React from 'react';
import { AlertTriangle, Trash2, Info, AlertCircle } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconClassName: 'text-red-600',
    confirmClassName: 'bg-red-600 hover:bg-red-700 text-white',
    bgClassName: 'bg-red-50',
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: 'text-amber-600',
    confirmClassName: 'bg-amber-600 hover:bg-amber-700 text-white',
    bgClassName: 'bg-amber-50',
  },
  info: {
    icon: Info,
    iconClassName: 'text-blue-600',
    confirmClassName: 'bg-blue-600 hover:bg-blue-700 text-white',
    bgClassName: 'bg-blue-50',
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" showClose={!isLoading}>
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={`rounded-full p-3 ${config.bgClassName}`}>
              <Icon className={`h-6 w-6 ${config.iconClassName}`} />
            </div>
            <div className="flex-1 pt-1">
              <DialogTitle className="text-left">{title}</DialogTitle>
              <DialogDescription className="text-left mt-2">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={config.confirmClassName}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easier usage
export function useConfirmDialog() {
  const [dialogState, setDialogState] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: ConfirmDialogVariant;
    confirmText?: string;
    cancelText?: string;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const confirm = (options: {
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: ConfirmDialogVariant;
    confirmText?: string;
    cancelText?: string;
  }) => {
    setDialogState({
      ...options,
      open: true,
    });
  };

  const closeDialog = () => {
    setDialogState((prev) => ({ ...prev, open: false }));
  };

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      open={dialogState.open}
      onOpenChange={closeDialog}
      title={dialogState.title}
      description={dialogState.description}
      onConfirm={dialogState.onConfirm}
      variant={dialogState.variant}
      confirmText={dialogState.confirmText}
      cancelText={dialogState.cancelText}
    />
  );

  return {
    confirm,
    ConfirmDialog: ConfirmDialogComponent,
  };
}
