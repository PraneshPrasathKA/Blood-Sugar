import { TimeSlot } from '@/types';

export const TIME_SLOT_OPTIONS: Array<{ value: TimeSlot; label: string }> = [
  { value: 'MORNING_FASTING', label: 'Morning (fasting)' },
  { value: 'AFTER_BREAKFAST', label: 'After breakfast' },
  { value: 'AFTER_LUNCH', label: 'After lunch' },
  { value: 'AFTER_DINNER', label: 'After dinner' },
];

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  MORNING_FASTING: 'Morning (fasting)',
  AFTER_BREAKFAST: 'After breakfast',
  AFTER_LUNCH: 'After lunch',
  AFTER_DINNER: 'After dinner',
};

export function getGlucoseStatus(value: number): {
  label: string;
  className: string;
} {
  if (value < 70) {
    return {
      label: 'Low',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }
  if (value <= 140) {
    return {
      label: 'In range',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  if (value <= 180) {
    return {
      label: 'Elevated',
      className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
  }
  return {
    label: 'High',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
  };
}

