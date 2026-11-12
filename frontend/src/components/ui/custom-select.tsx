'use client';

import { Check, ChevronDown } from 'lucide-react';
import { KeyboardEvent as ReactKeyboardEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface CustomSelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  badge?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface CustomSelectProps<T extends string = string> {
  id?: string;
  value: T;
  options: CustomSelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function CustomSelect<T extends string = string>({
  id,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  ariaLabel,
  className,
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) {
      setHighlightedIndex(-1);
      return;
    }

    const currentIdx = options.findIndex(
      (opt) => opt.value === value && !opt.disabled
    );
    if (currentIdx >= 0) {
      setHighlightedIndex(currentIdx);
    } else {
      setHighlightedIndex(options.findIndex((opt) => !opt.disabled));
    }

    const handleOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, options, value]);

  const moveHighlight = (direction: 1 | -1) => {
    if (options.length === 0) return;
    let idx = highlightedIndex;
    for (let step = 0; step < options.length; step++) {
      idx = (idx + direction + options.length) % options.length;
      if (!options[idx].disabled) {
        setHighlightedIndex(idx);
        return;
      }
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        moveHighlight(1);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        moveHighlight(-1);
      }
    } else if (event.key === 'Enter' && open) {
      event.preventDefault();
      const target = options[highlightedIndex];
      if (target && !target.disabled) {
        onChange(target.value);
        setOpen(false);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={cn('relative', className)}
    >
      <button
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
          !selectedOption && 'text-muted-foreground'
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 text-primary">{selectedOption.icon}</span>
          )}
          <span className="truncate font-medium text-foreground">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel || 'Options'}
          className="absolute left-0 right-0 top-11 z-50 max-h-72 overflow-auto rounded-xl border border-border bg-card p-1.5 shadow-xl"
        >
          {options.map((option, idx) => {
            const isSelected = option.value === value;
            const isHighlighted = idx === highlightedIndex;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled}
                disabled={option.disabled}
                onMouseEnter={() => {
                  if (!option.disabled) setHighlightedIndex(idx);
                }}
                onClick={() => {
                  if (option.disabled) return;
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                  isSelected
                    ? 'bg-accent text-accent-foreground font-medium'
                    : isHighlighted
                      ? 'bg-muted text-foreground'
                      : 'text-foreground hover:bg-muted',
                  option.disabled &&
                    'cursor-not-allowed opacity-55 hover:bg-transparent'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {option.icon && (
                    <span
                      className={cn(
                        'shrink-0',
                        option.disabled ? 'text-muted-foreground' : 'text-primary'
                      )}
                    >
                      {option.icon}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate">{option.label}</p>
                    {option.description && (
                      <p className="truncate text-[11px] text-muted-foreground">
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {option.badge && (
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {option.badge}
                    </span>
                  )}
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
