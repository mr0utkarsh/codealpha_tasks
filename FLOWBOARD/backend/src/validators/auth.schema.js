import { z } from 'zod';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(80, 'Name must be at most 80 characters.'),
  email: z
    .string()
    .trim()
    .max(254, 'Email must be at most 254 characters.')
    .refine((value) => EMAIL_RE.test(value), 'Enter a valid email address.')
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters.')
    .max(100, 'Password must be at most 100 characters.'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .refine((value) => EMAIL_RE.test(value), 'Enter a valid email address.')
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'Password is required.'),
});
