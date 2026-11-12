'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TIME_SLOT_LABELS } from '@/lib/constants';
import { formatDisplayDate } from '@/lib/dates';
import { Reading } from '@/types';

interface DeleteReadingDialogProps {
  reading: Reading | null;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: (reading: Reading) => void;
}

export function DeleteReadingDialog({
  reading,
  isDeleting = false,
  onClose,
  onConfirm,
}: DeleteReadingDialogProps) {
  return (
    <Dialog open={Boolean(reading)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete reading</DialogTitle>
          <DialogDescription>
            {reading
              ? `Are you sure you want to delete your ${TIME_SLOT_LABELS[reading.time_slot]} reading (${reading.glucose_value} mg/dL) on ${formatDisplayDate(reading.reading_date)}? This action cannot be undone.`
              : ''}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!reading || isDeleting}
            onClick={() => reading && onConfirm(reading)}
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete reading
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

