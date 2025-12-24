import React from 'react';
import { cn } from '@/core/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options = [], ...props }, ref) => {
    return (
      <div className={cn("w-full", className)}>
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5 cursor-default">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 pr-10 text-sm text-foreground cursor-pointer',
              'ring-offset-background appearance-none transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'hover:border-primary/50 hover:shadow-sm',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive focus-visible:ring-destructive'
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
