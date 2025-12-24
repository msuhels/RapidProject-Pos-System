'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/core/lib/utils';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined);

function useDialog() {
  const context = React.useContext(DialogContext);
  
  // During SSR, return a default value instead of throwing
  if (!context) {
    if (typeof window === 'undefined') {
      return { open: false, onOpenChange: () => {} };
    }
    throw new Error('Dialog components must be used within a Dialog');
  }
  
  return context;
}

export function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = onOpenChange || setUncontrolledOpen;

  return (
    <DialogContext.Provider value={{ open, onOpenChange: setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ 
  children, 
  asChild = false 
}: { 
  children: React.ReactNode; 
  asChild?: boolean;
}) {
  const { onOpenChange } = useDialog();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        onOpenChange(true);
        (children.props as any).onClick?.(e);
      },
    } as any);
  }

  return (
    <button onClick={() => onOpenChange(true)}>
      {children}
    </button>
  );
}

export function DialogContent({ 
  children, 
  className,
  showClose = true,
}: { 
  children: React.ReactNode; 
  className?: string;
  showClose?: boolean;
}) {
  const { open, onOpenChange } = useDialog();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog */}
      <div 
        className={cn(
          'relative z-50 w-full max-w-lg bg-card text-card-foreground rounded-lg shadow-lg border border-border',
          'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2',
          'mx-4',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {showClose && (
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left px-6 pt-6 pb-2', className)}>
      {children}
    </div>
  );
}

export function DialogFooter({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 px-6 pb-6 pt-4', className)}>
      {children}
    </div>
  );
}

export function DialogTitle({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)}>
      {children}
    </h2>
  );
}

export function DialogDescription({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </p>
  );
}
