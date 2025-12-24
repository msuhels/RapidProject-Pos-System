import React from 'react';
import { cn } from '@/core/lib/utils';

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  label?: string;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, disabled, className, id, label, ...props }, ref) => {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-disabled={disabled}
          disabled={disabled}
          onClick={() => {
            if (!disabled && onCheckedChange) {
              onCheckedChange(!checked);
            }
          }}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            disabled && 'cursor-not-allowed opacity-50',
            checked ? 'bg-primary' : 'bg-input'
          )}
          {...props}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out',
              checked ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-foreground cursor-pointer">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';

