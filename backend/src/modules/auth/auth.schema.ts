import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z
      .string({ required_error: 'Full name is required.' })
      .trim()
      .min(2, 'Name must be at least 2 characters.')
      .max(150, 'Name must be at most 150 characters.'),
    email: z
      .string({ required_error: 'Email is required.' })
      .trim()
      .email('Please enter a valid email address.')
      .max(255, 'Email is too long.'),
    password: z
      .string({ required_error: 'Password is required.' })
      .min(6, 'Password must be at least 6 characters.')
      .max(128, 'Password is too long.'),
    confirmPassword: z.string({
      required_error: 'Please confirm your password.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .trim()
    .email('Please enter a valid email address.'),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(1, 'Password is required.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

