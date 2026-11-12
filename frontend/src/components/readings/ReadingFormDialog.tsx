'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useCreateReading,
  useReadings,
  useUpdateReading,
} from '@/hooks/useReadings';
import { useToast } from '@/hooks/useToast';
import { getTodayDateString } from '@/lib/dates';
import { ApiError } from '@/services/api';
import { Reading, TimeSlot } from '@/types';
import { ReadingForm } from './ReadingForm';

interface ReadingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingReading?: Reading | null;
  defaultDate?: string;
  onSuccess?: (message: string) => void;
}

export function ReadingFormDialog({
  open,
  onOpenChange,
  editingReading,
  defaultDate,
  onSuccess,
}: ReadingFormDialogProps) {
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState(
    editingReading?.reading_date ?? defaultDate ?? getTodayDateString()
  );

  useEffect(() => {
    setActiveDate(
      editingReading?.reading_date ?? defaultDate ?? getTodayDateString()
    );
  }, [editingReading, defaultDate, open]);

  const createMutation = useCreateReading();
  const updateMutation = useUpdateReading();

  const { data: dateReadingsData } = useReadings({
    date: activeDate,
    limit: 10,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setServerError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (values: {
    reading_date: string;
    time_slot: TimeSlot;
    glucose_value: number;
  }) => {
    setServerError(null);
    try {
      if (editingReading) {
        await updateMutation.mutateAsync({
          id: editingReading.id,
          input: values,
        });
        const msg = 'Reading updated successfully.';
        toast.success(msg);
        onSuccess?.(msg);
      } else {
        await createMutation.mutateAsync(values);
        const msg = 'Reading added successfully.';
        toast.success(msg);
        onSuccess?.(msg);
      }
      handleOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
        toast.error(error.message, 'Validation error');
      } else {
        const msg = 'Unable to save reading. Please try again.';
        setServerError(msg);
        toast.error(msg);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingReading ? 'Edit blood glucose reading' : 'Add blood glucose reading'}
          </DialogTitle>
          <DialogDescription>
            Record up to 4 readings per day across your meal and fasting slots.
          </DialogDescription>
        </DialogHeader>

        <ReadingForm
          initialReading={editingReading}
          existingReadingsForDate={dateReadingsData?.readings ?? []}
          defaultDate={defaultDate}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          serverError={serverError}
          onDateChange={setActiveDate}
          onSubmit={handleSubmit}
          onCancel={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
