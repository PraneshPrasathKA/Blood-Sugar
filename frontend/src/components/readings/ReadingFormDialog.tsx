'use client';

import { useState } from 'react';
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
  const [serverError, setServerError] = useState<string | null>(null);
  const createMutation = useCreateReading();
  const updateMutation = useUpdateReading();

  const { data: recentData } = useReadings({ page: 1, limit: 50 });

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
        onSuccess?.('Reading updated successfully.');
      } else {
        await createMutation.mutateAsync(values);
        onSuccess?.('Reading added successfully.');
      }
      handleOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError('Unable to save reading. Please try again.');
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
          existingReadingsForDate={recentData?.readings ?? []}
          defaultDate={defaultDate}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          serverError={serverError}
          onSubmit={handleSubmit}
          onCancel={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

