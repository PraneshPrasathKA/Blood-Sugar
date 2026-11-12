'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  Coffee,
  Loader2,
  Moon,
  Sparkles,
  Sun,
  Sunrise,
} from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { CustomSelect, CustomSelectOption } from '@/components/ui/custom-select';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getNextAvailableSlot, TIME_SLOT_OPTIONS } from '@/lib/constants';
import { getTodayDateString } from '@/lib/dates';
import { ReadingFormInput, readingFormSchema } from '@/lib/validations';
import { Reading, TimeSlot } from '@/types';

const SLOT_ICONS: Record<TimeSlot, ReactNode> = {
  MORNING_FASTING: <Sunrise className="h-4 w-4" />,
  AFTER_BREAKFAST: <Coffee className="h-4 w-4" />,
  AFTER_LUNCH: <Sun className="h-4 w-4" />,
  AFTER_DINNER: <Moon className="h-4 w-4" />,
};

interface ReadingFormProps {
  initialReading?: Reading | null;
  existingReadingsForDate?: Reading[];
  defaultDate?: string;
  isSubmitting?: boolean;
  serverError?: string | null;
  onDateChange?: (date: string) => void;
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
  onDateChange,
  onSubmit,
  onCancel,
}: ReadingFormProps) {
  const today = getTodayDateString();
  const isEditing = Boolean(initialReading);
  const initialDate = initialReading?.reading_date ?? defaultDate ?? today;

  const initialSlot =
    initialReading?.time_slot ??
    getNextAvailableSlot(existingReadingsForDate, initialDate);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ReadingFormInput>({
    resolver: zodResolver(readingFormSchema),
    defaultValues: {
      reading_date: initialDate,
      time_slot: initialSlot,
      glucose_value: initialReading
        ? String(initialReading.glucose_value)
        : '',
    },
  });

  useEffect(() => {
    const nextDate = initialReading?.reading_date ?? defaultDate ?? today;
    const nextSlot =
      initialReading?.time_slot ??
      getNextAvailableSlot(existingReadingsForDate, nextDate);
    reset({
      reading_date: nextDate,
      time_slot: nextSlot,
      glucose_value: initialReading
        ? String(initialReading.glucose_value)
        : '',
    });
  }, [initialReading, defaultDate, today, reset]);

  const selectedDate = watch('reading_date');
  const selectedSlot = watch('time_slot');

  const readingsOnSelectedDate = existingReadingsForDate.filter(
    (r) => r.reading_date === selectedDate && r.id !== initialReading?.id
  );
  const readingBySlot = new Map<TimeSlot, Reading>(
    readingsOnSelectedDate.map((r) => [r.time_slot, r])
  );
  const allFourLogged = !isEditing && readingBySlot.size >= 4;

  // Automatically pick the next available slot after what is already logged
  // whenever the date changes or new readings arrive for that date.
  useEffect(() => {
    if (isEditing) return;
    if (readingBySlot.has(selectedSlot)) {
      const nextSlot = getNextAvailableSlot(
        existingReadingsForDate,
        selectedDate,
        initialReading?.id
      );
      setValue('time_slot', nextSlot, { shouldValidate: false });
    }
  }, [
    isEditing,
    selectedDate,
    selectedSlot,
    existingReadingsForDate,
    initialReading?.id,
    setValue,
  ]);

  const slotOptions: CustomSelectOption<TimeSlot>[] = TIME_SLOT_OPTIONS.map(
    (option) => {
      const existing = readingBySlot.get(option.value);
      return {
        value: option.value,
        label: option.label,
        description: option.description,
        icon: SLOT_ICONS[option.value],
        disabled: Boolean(existing),
        badge: existing ? `Logged · ${existing.glucose_value} mg/dL` : undefined,
      };
    }
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
        <Controller
          name="reading_date"
          control={control}
          render={({ field }) => (
            <DatePicker
              id="reading_date"
              ariaLabel="Date"
              value={field.value}
              maxDate={today}
              onChange={(nextDate) => {
                field.onChange(nextDate);
                onDateChange?.(nextDate);
                if (!isEditing) {
                  const autoSlot = getNextAvailableSlot(
                    existingReadingsForDate,
                    nextDate
                  );
                  setValue('time_slot', autoSlot, { shouldValidate: false });
                }
              }}
            />
          )}
        />
        {errors.reading_date && (
          <p className="text-xs font-medium text-destructive" role="alert">
            {errors.reading_date.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="time_slot">Time slot</Label>
        <Controller
          name="time_slot"
          control={control}
          render={({ field }) => (
            <CustomSelect<TimeSlot>
              id="time_slot"
              ariaLabel="Time slot"
              value={field.value}
              options={slotOptions}
              onChange={field.onChange}
            />
          )}
        />
        {!isEditing && readingBySlot.size > 0 && !allFourLogged && (
          <p className="flex items-center gap-1.5 text-xs text-primary">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>
              {readingBySlot.size} of 4 slots logged for this date — next open slot selected.
            </span>
          </p>
        )}
        {allFourLogged && (
          <p className="text-xs font-medium text-emerald-700">
            All 4 daily slots are already logged for this date.
          </p>
        )}
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
