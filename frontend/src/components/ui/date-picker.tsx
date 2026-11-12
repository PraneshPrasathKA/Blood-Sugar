'use client';

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDisplayDate, getTodayDateString } from '@/lib/dates';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (nextDate: string) => void;
  maxDate?: string;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    };
  }
  return { year: y, month: m, day: d };
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function DatePicker({
  id,
  value,
  onChange,
  maxDate = getTodayDateString(),
  placeholder = 'Select date',
  clearable = false,
  disabled = false,
  ariaLabel,
  className,
}: DatePickerProps) {
  const today = getTodayDateString();
  const initialParts = parseDateParts(value || today);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initialParts.year);
  const [viewMonth, setViewMonth] = useState(initialParts.month);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const parts = parseDateParts(value);
      setViewYear(parts.year);
      setViewMonth(parts.month);
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;

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
  }, [open]);

  const calendarCells = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const cells: Array<{ iso: string; day: number } | null> = [];

    for (let i = 0; i < firstWeekday; i++) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ iso: toIsoDate(viewYear, viewMonth, day), day });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const goPrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectDate = (iso: string) => {
    if (maxDate && iso > maxDate) return;
    onChange(iso);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="flex items-center gap-1">
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
            !value && 'text-muted-foreground'
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <CalendarIcon className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate font-medium">
              {value ? formatDisplayDate(value) : placeholder}
            </span>
          </span>
        </button>

        {clearable && value && (
          <button
            type="button"
            aria-label="Clear date"
            onClick={() => onChange('')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Calendar date picker"
          className="absolute left-0 top-12 z-50 w-72 rounded-xl border border-border bg-card p-3.5 shadow-xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="Previous month"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {MONTHS[viewMonth - 1]} {viewYear}
            </span>
            <button
              type="button"
              onClick={goNextMonth}
              aria-label="Next month"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1.5 grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="h-8" />;
              }

              const isDisabled = Boolean(maxDate && cell.iso > maxDate);
              const isSelected = cell.iso === value;
              const isToday = cell.iso === today;

              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={isDisabled}
                  aria-label={cell.iso}
                  aria-pressed={isSelected}
                  onClick={() => selectDate(cell.iso)}
                  className={cn(
                    'flex h-8 w-full items-center justify-center rounded-lg text-xs font-medium transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : isToday
                        ? 'border border-primary/50 bg-accent/60 text-accent-foreground hover:bg-accent'
                        : 'text-foreground hover:bg-muted',
                    isDisabled &&
                      'cursor-not-allowed text-muted-foreground/40 hover:bg-transparent'
                  )}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
            <button
              type="button"
              onClick={() => selectDate(today)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Jump to today
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

