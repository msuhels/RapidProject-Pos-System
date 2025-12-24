'use client';

/**
 * CustomSelect Component
 * 
 * A beautiful, modern dropdown component with smooth animations and better UX.
 * 
 * Features:
 * - Custom styled dropdown with smooth animations
 * - Keyboard accessible
 * - Click outside to close
 * - Selected item indicator with checkmark
 * - Hover effects and transitions
 * - Dark mode support
 * - Responsive design
 * 
 * Usage:
 * ```tsx
 * <CustomSelect
 *   label="Select Role"
 *   placeholder="Choose a role"
 *   value={selectedRole}
 *   onChange={(value) => setSelectedRole(value)}
 *   options={[
 *     { value: 'admin', label: 'Administrator' },
 *     { value: 'user', label: 'User' }
 *   ]}
 * />
 * ```
 * 
 * Note: For simple cases or when you need native select behavior,
 * use the standard Select component instead.
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/core/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectProps {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  options?: Array<{ value: string; label: string }>;
  disabled?: boolean;
  className?: string;
}

export const CustomSelect = React.forwardRef<HTMLDivElement, CustomSelectProps>(
  ({ className, label, error, placeholder = 'Select an option', value, onChange, options = [], disabled = false }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value || '');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value);
      }
    }, [value]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
      setSelectedValue(optionValue);
      onChange?.(optionValue);
      setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.value === selectedValue);
    const displayText = selectedOption?.label || placeholder;

    return (
      <div className={cn("w-full", className)} ref={ref}>
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5 cursor-default">
            {label}
          </label>
        )}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm',
              'ring-offset-background transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'hover:border-primary/50 hover:shadow-sm',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive focus-visible:ring-destructive',
              isOpen && 'border-primary ring-2 ring-ring ring-offset-2',
              !selectedValue && 'text-muted-foreground'
            )}
          >
            <span className="truncate text-foreground">{displayText}</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ml-2',
                isOpen && 'rotate-180'
              )}
            />
          </button>

          {isOpen && !disabled && (
            <div className="absolute z-50 mt-2 w-full animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
              <div className="rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                <div className="max-h-60 overflow-y-auto p-1">
                  {options.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                      No options available
                    </div>
                  ) : (
                    options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                          'hover:bg-accent hover:text-accent-foreground cursor-pointer',
                          'focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground',
                          selectedValue === option.value && 'bg-primary/10 text-primary font-medium'
                        )}
                      >
                        <span className="truncate">{option.label}</span>
                        {selectedValue === option.value && (
                          <Check className="h-4 w-4 flex-shrink-0 ml-2" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1">{error}</p>
        )}
      </div>
    );
  }
);

CustomSelect.displayName = 'CustomSelect';

