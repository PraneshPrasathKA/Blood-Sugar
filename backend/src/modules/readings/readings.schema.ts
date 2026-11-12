import { z } from 'zod';
import { isFutureDate, isValidDateString } from '../../utils/dates';
import { TIME_SLOTS } from './readings.types';

const glucoseValueSchema = z.preprocess(
  (val) => {
    if (val === undefined || val === null || val === '') {
      return undefined;
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed === '') return undefined;
      const parsed = Number(trimmed);
      return parsed;
    }
    return val;
  },
  z
    .number({
      required_error: 'Please enter a glucose value.',
      invalid_type_error: 'Value must be between 40 and 600 mg/dl.',
    })
    .refine(
      (n) => Number.isFinite(n) && Number.isInteger(n) && n >= 40 && n <= 600,
      {
        message: 'Value must be between 40 and 600 mg/dl.',
      }
    )
);

const readingDateSchema = z
  .string({
    required_error: 'Date is required.',
    invalid_type_error: 'Please provide a valid date in YYYY-MM-DD format.',
  })
  .refine(isValidDateString, {
    message: 'Please provide a valid date in YYYY-MM-DD format.',
  })
  .refine((date) => !isFutureDate(date), {
    message: 'Date cannot be in the future.',
  });

const timeSlotSchema = z.enum(TIME_SLOTS, {
  errorMap: () => ({
    message:
      'Time slot must be MORNING_FASTING, AFTER_BREAKFAST, AFTER_LUNCH, or AFTER_DINNER.',
  }),
});

export const createReadingSchema = z.object({
  reading_date: readingDateSchema,
  time_slot: timeSlotSchema,
  glucose_value: glucoseValueSchema,
});

export const updateReadingSchema = z
  .object({
    reading_date: readingDateSchema.optional(),
    time_slot: timeSlotSchema.optional(),
    glucose_value: glucoseValueSchema.optional(),
  })
  .refine(
    (data) =>
      data.reading_date !== undefined ||
      data.time_slot !== undefined ||
      data.glucose_value !== undefined,
    {
      message: 'At least one field must be provided for update.',
    }
  );

export const listReadingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  date: z
    .string()
    .refine(isValidDateString, 'Invalid date filter.')
    .optional(),
  from: z
    .string()
    .refine(isValidDateString, 'Invalid from date filter.')
    .optional(),
  to: z
    .string()
    .refine(isValidDateString, 'Invalid to date filter.')
    .optional(),
});

export type CreateReadingInput = z.infer<typeof createReadingSchema>;
export type UpdateReadingInput = z.infer<typeof updateReadingSchema>;
export type ListReadingsQuery = z.infer<typeof listReadingsQuerySchema>;

