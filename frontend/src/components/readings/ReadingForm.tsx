'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TIME_SLOT_OPTIONS } from '@/lib/constants';
import { getTodayDateString } from '@/lib/dates';
import { ReadingFormInput, readingFormSchema } from '@/lib/validations';
import { Reading, TimeSlot } from '@/types';

interface ReadingFormProps {
  initialReading?: Reading | null;
  existingReadingsForDate?: Reading[];
  defaultDate?: string;
  isSubmitting?: boolean;
  serverError?: string | null;
  onSubmit: (values: {
    reading_date: string;
    time_slot: TimeSlot;
    glucose_value: number;
  }) => Promise<void> | void;
  onCancel?: () => void;
}

export function ReadingForm({
  initialReading,
  existingReadingsForDate = [],
  defaultDate,
  isSubmitting = false,
  serverError,
  onSubmit,
  onCancel,
}: ReadingFormProps) {
  const today = getTodayDateString();
  const isEditing = Boolean(initialReading);

  const usedSlotsOnInitialDate = new Set(
    existingReadingsForDate
      .filter((r) => r.id !== initialReading?.id)
      .map((r) => r.time_slot)
  );

  const firstAvailableSlot =
    TIME_SLOT_OPTIONS.find((opt) => !usedSlotsOnInitialDate.has(opt.value))
      ?.value ?? 'MORNING_FASTING';

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReadingFormInput>({
    resolver: zodResolver(readingFormSchema),
    defaultValues: {
      reading_date: initialReading?.reading_date ?? defaultDate ?? today,
      time_slot: initialReading?.time_slot ?? firstAvailableSlot,
      glucose_value: initialReading
        ? String(initialReading.glucose_value)
        : '',
    },
  });

  useEffect(() => {
    reset({
      reading_date: initialReading?.reading_date ?? defaultDate ?? today,
      time_slot: initialReading?.time_slot ?? firstAvailableSlot,
      glucose_value: initialReading
        ? String(initialReading.glucose_value)
        : '',
    });
  }, [initialReading, defaultDate, today, firstAvailableSlot, reset]);

  const selectedDate = watch('reading_date');
  const slotsTakenForSelectedDate = new Set(
    existingReadingsForDate
      .filter(
        (r) => r.reading_date === selectedDate && r.id !== initialReading?.id
      )
      .map((r) => r.time_slot)
  );

  const handleFormSubmit = handleSubmit(async (rawValues) => {
    const parsed = readingFormSchema.parse(rawValues);
    await onSubmit({
      reading_date: parsed.reading_date,
      time_slot: parsed.time_slot,
      glucose_value: Number(parsed.glucose_value),
    });
  });

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="reading_date">Date</Label>
        <Input
          id="reading_date"
          type="date"
          max={today}
          {...register('reading_date')}
        />
        {errors.reading_date && (
          <p className="text-xs font-medium text-destructive" role="alert">
            {errors.reading_date.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="time_slot">Time slot</Label>
        <select
          id="time_slot"
          className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          {...register('time_slot')}
        >
          {TIME_SLOT_OPTIONS.map((option) => {
            const alreadyLogged = slotsTakenForSelectedDate.has(option.value);
            return (
              <option
                key={option.value}
                value={option.value}
                disabled={alreadyLogged}
              >
                {option.label}
                {alreadyLogged ? ' (Already logged)' : ''}
              </option>
            );
          })}
        </select>
        {errors.time_slot && (
          <p className="text-xs font-medium text-destructive" role="alert">
            {errors.time_slot.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="glucose_value">Glucose value (mg/dL)</Label>
        <Input
          id="glucose_value"
          type="number"
          inputMode="numeric"
          placeholder="e.g. 115"
          {...register('glucose_value')}
        />
        <p className="text-xs text-muted-foreground">
          Enter a whole number between 40 and 600 mg/dL.
        </p>
        {errors.glucose_value && (
          <p className="text-xs font-medium text-destructive" role="alert">
            {errors.glucose_value.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? 'Save changes' : 'Add reading'}
        </Button>
      </div>
    </form>
  );
}

