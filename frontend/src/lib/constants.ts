import { Reading, TimeSlot } from '@/types';

export const TARGET_GLUCOSE_MIN = 70;
export const TARGET_GLUCOSE_MAX = 140;

export const TIME_SLOT_OPTIONS: Array<{
  value: TimeSlot;
  label: string;
  description: string;
}> = [
  {
    value: 'MORNING_FASTING',
    label: 'Morning (fasting)',
    description: 'Before breakfast · overnight fast',
  },
  {
    value: 'AFTER_BREAKFAST',
    label: 'After breakfast',
    description: '1–2 hours after morning meal',
  },
  {
    value: 'AFTER_LUNCH',
    label: 'After lunch',
    description: '1–2 hours after midday meal',
  },
  {
    value: 'AFTER_DINNER',
    label: 'After dinner',
    description: '1–2 hours after evening meal',
  },
];

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  MORNING_FASTING: 'Morning (fasting)',
  AFTER_BREAKFAST: 'After breakfast',
  AFTER_LUNCH: 'After lunch',
  AFTER_DINNER: 'After dinner',
};

export function getNextAvailableSlot(
  readings: Reading[],
  selectedDate: string,
  excludeReadingId?: string
): TimeSlot {
  const loggedForDate = readings.filter(
    (r) => r.reading_date === selectedDate && r.id !== excludeReadingId
  );

  if (loggedForDate.length === 0) {
    return 'MORNING_FASTING';
  }

  const takenSlots = new Set(loggedForDate.map((r) => r.time_slot));
  const order = TIME_SLOT_OPTIONS.map((opt) => opt.value);

  // Pick the next unlogged slot strictly after the latest logged slot,
  // wrapping around to catch any skipped earlier slot.
  let highestLoggedIdx = -1;
  for (const reading of loggedForDate) {
    const idx = order.indexOf(reading.time_slot);
    if (idx > highestLoggedIdx) {
      highestLoggedIdx = idx;
    }
  }

  for (let offset = 1; offset <= order.length; offset++) {
    const candidate = order[(highestLoggedIdx + offset) % order.length];
    if (!takenSlots.has(candidate)) {
      return candidate;
    }
  }

  return 'MORNING_FASTING';
}

export function getGlucoseStatus(value: number): {
  label: string;
  className: string;
} {
  if (value < TARGET_GLUCOSE_MIN) {
    return {
      label: 'Low',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }
  if (value <= TARGET_GLUCOSE_MAX) {
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

export interface RangeAssessment {
  label: string;
  detail: string;
  badgeClassName: string;
  isLowWarning?: boolean;
}

export function getAverageRangeAssessment(
  average: number | null | undefined
): RangeAssessment {
  if (average === null || average === undefined) {
    return {
      label: 'No data',
      detail: 'Target range: 70–140 mg/dL',
      badgeClassName: 'bg-muted text-muted-foreground border-border',
    };
  }
  if (average < TARGET_GLUCOSE_MIN) {
    return {
      label: 'Lower than normal',
      detail: `${(TARGET_GLUCOSE_MIN - average).toFixed(1)} mg/dL below 70–140 target`,
      badgeClassName: 'bg-amber-50 text-amber-800 border-amber-300',
      isLowWarning: true,
    };
  }
  if (average < 85) {
    return {
      label: 'Low-normal',
      detail: 'Near lower bound of 70–140 target',
      badgeClassName: 'bg-sky-50 text-sky-700 border-sky-200',
    };
  }
  if (average <= TARGET_GLUCOSE_MAX) {
    return {
      label: 'In target range',
      detail: 'Within 70–140 mg/dL healthy target',
      badgeClassName: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  if (average <= 180) {
    return {
      label: 'Slightly elevated',
      detail: `+${(average - TARGET_GLUCOSE_MAX).toFixed(1)} mg/dL above 140 target`,
      badgeClassName: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
  }
  return {
    label: 'Above target',
    detail: `+${(average - TARGET_GLUCOSE_MAX).toFixed(1)} mg/dL above 140 target`,
    badgeClassName: 'bg-rose-50 text-rose-700 border-rose-200',
  };
}

export function getHighestRangeAssessment(
  highest: number | null | undefined
): RangeAssessment {
  if (highest === null || highest === undefined) {
    return {
      label: 'No data',
      detail: 'Target ceiling: 140 mg/dL',
      badgeClassName: 'bg-muted text-muted-foreground border-border',
    };
  }
  if (highest <= TARGET_GLUCOSE_MAX) {
    return {
      label: 'In range',
      detail: `Within ≤140 target (${TARGET_GLUCOSE_MAX - highest} mg/dL below limit)`,
      badgeClassName: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  if (highest <= 180) {
    return {
      label: 'Elevated',
      detail: `+${highest - TARGET_GLUCOSE_MAX} mg/dL above 140 target`,
      badgeClassName: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
  }
  return {
    label: 'High peak',
    detail: `+${highest - TARGET_GLUCOSE_MAX} mg/dL above 140 target`,
    badgeClassName: 'bg-rose-50 text-rose-700 border-rose-200',
  };
}

export function getLowestRangeAssessment(
  lowest: number | null | undefined
): RangeAssessment {
  if (lowest === null || lowest === undefined) {
    return {
      label: 'No data',
      detail: 'Target floor: 70 mg/dL',
      badgeClassName: 'bg-muted text-muted-foreground border-border',
    };
  }
  if (lowest < TARGET_GLUCOSE_MIN) {
    return {
      label: 'Below range',
      detail: `${TARGET_GLUCOSE_MIN - lowest} mg/dL below 70 target`,
      badgeClassName: 'bg-amber-50 text-amber-800 border-amber-300',
      isLowWarning: true,
    };
  }
  if (lowest <= TARGET_GLUCOSE_MAX) {
    return {
      label: 'In range',
      detail: `Within ≥70 target (+${lowest - TARGET_GLUCOSE_MIN} mg/dL buffer)`,
      badgeClassName: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  return {
    label: 'Elevated floor',
    detail: `+${lowest - TARGET_GLUCOSE_MAX} mg/dL above 140 target`,
    badgeClassName: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };
}
