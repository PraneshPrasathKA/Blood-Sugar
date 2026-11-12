import { z } from 'zod';
import { getTodayDateString } from './dates';

export const loginFormSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const registerFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters.')
      .max(150, 'Name must be at most 150 characters.'),
    email: z.string().trim().email('Please enter a valid email address.'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters.')
      .max(128, 'Password is too long.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const readingFormSchema = z.object({
  reading_date: z
    .string()
    .min(1, 'Please select a date.')
    .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Please select a valid date.',
    })
    .refine((val) => val <= getTodayDateString(), {
      message: 'Date cannot be in the future.',
    }),
  time_slot: z.enum(
    ['MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER'],
    {
      errorMap: () => ({ message: 'Please select a time slot.' }),
    }
  ),
  glucose_value: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, {
      message: 'Please enter a glucose value.',
    })
    .refine(
      (val) => {
        const num = Number(val);
        return (
          Number.isFinite(num) &&
          Number.isInteger(num) &&
          num >= 40 &&
          num <= 600
        );
      },
      {
        message: 'Value must be between 40 and 600 mg/dl.',
      }
    ),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type ReadingFormInput = z.input<typeof readingFormSchema>;
export type ReadingFormValues = z.output<typeof readingFormSchema>;

