import { z } from 'zod';
import { getTodayDateString, isValidDateString } from '../../utils/dates';

export const reportDateQuerySchema = z.object({
  date: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() !== '' ? val.trim() : getTodayDateString()))
    .refine(isValidDateString, {
      message: 'Please provide a valid date in YYYY-MM-DD format.',
    }),
});

export type ReportDateQuery = z.infer<typeof reportDateQuerySchema>;

