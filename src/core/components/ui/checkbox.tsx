import React from 'react';
import { cn } from '@/core/lib/utils';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  /**
   * Controlled checked state.
   */
  checked?: boolean;
  /**
   * ShadCN-style change handler.
   */
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          onCheckedChange?.(!checked);
        }}
        className={cn(
          'inline-flex h-4 w-4 items-center justify-center rounded border',
          'transition-colors focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          disabled && 'cursor-not-allowed opacity-50',
          !disabled && 'cursor-pointer',
          checked
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-background text-transparent border-input',
          className
        )}
        aria-pressed={checked}
        aria-disabled={disabled}
      >
        <span className="text-[10px] leading-none select-none">✓</span>
        <input
          ref={ref}
          type="checkbox"
          className="sr-only"
          checked={checked}
          readOnly
          {...props}
        />
      </button>
    );
  }
);

Checkbox.displayName = 'Checkbox';


