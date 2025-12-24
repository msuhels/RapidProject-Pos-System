'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/core/lib/utils';
import { FormSkeleton } from '@/core/components/ui/skeleton';

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  isLoading?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
};

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = '2xl',
  isLoading = false,
}: FormDialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-0">
      {/* Backdrop with smooth fade */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 ease-out animate-in fade-in-0"
        onClick={() => !isLoading && onOpenChange(false)}
      />

      {/* Dialog with smooth slide and scale animation */}
      <div
        className={cn(
          'relative z-50 w-full bg-card text-card-foreground rounded-xl shadow-2xl border border-border/50',
          'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-300',
          'max-h-[90vh] sm:max-h-[85vh] flex flex-col',
          'mx-4 my-8 sm:my-0',
          maxWidthClasses[maxWidth]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient border */}
        <div className="relative border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
          <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {title}
                </h2>
                {description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
              {!isLoading && (
                <button
                  onClick={() => onOpenChange(false)}
                  className="rounded-lg p-2 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content with scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoading ? <FormSkeleton /> : children}
        </div>
      </div>
    </div>
  );
}

