export const TIME_SLOTS = [
  'MORNING_FASTING',
  'AFTER_BREAKFAST',
  'AFTER_LUNCH',
  'AFTER_DINNER',
] as const;

export type TimeSlot = (typeof TIME_SLOTS)[number];

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  MORNING_FASTING: 'Morning (fasting)',
  AFTER_BREAKFAST: 'After breakfast',
  AFTER_LUNCH: 'After lunch',
  AFTER_DINNER: 'After dinner',
};

export function formatDuplicateSlotError(slot: TimeSlot): string {
  switch (slot) {
    case 'MORNING_FASTING':
      return 'You already have a Morning (fasting) reading for this date.';
    case 'AFTER_BREAKFAST':
      return 'You already have an After breakfast reading for this date.';
    case 'AFTER_LUNCH':
      return 'You already have an After lunch reading for this date.';
    case 'AFTER_DINNER':
      return 'You already have an After dinner reading for this date.';
  }
}

export interface ReadingRecord {
  id: string;
  user_id: string;
  reading_date: string;
  time_slot: TimeSlot;
  glucose_value: number;
  created_at: Date;
  updated_at: Date;
}

