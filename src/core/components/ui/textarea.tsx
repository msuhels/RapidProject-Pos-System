import React from 'react';
import { cn } from '@/core/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full group">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2 cursor-default transition-colors">
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'flex min-h-[100px] w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground',
            'ring-offset-background placeholder:text-muted-foreground/60',
            'transition-all duration-200 resize-y',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'hover:border-primary/50 hover:shadow-sm',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input',
            error && 'border-destructive focus-visible:ring-destructive hover:border-destructive',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1 flex items-center gap-1">
            <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="mt-2 text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
