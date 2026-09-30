import { z } from 'zod';

/** Pragmatic email check that behaves identically across Zod major versions. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, 'Enter a valid email address.')
  .max(160, 'Email addresses must be 160 characters or fewer.')
  .refine((value) => EMAIL_PATTERN.test(value), 'Enter a valid email address.');

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .max(72, 'Passwords must be 72 characters or fewer.')
  .refine(
    (value) => /[A-Za-z]/.test(value) && /[0-9]/.test(value),
    'Include at least one letter and one number.'
  );

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Use at least 2 characters.')
  .max(80, 'Use 80 characters or fewer.');

export const idSchema = z.string().trim().min(1, 'A record id is required.').max(64);

export const cacheKeySchema = z.string().trim().min(1).max(160);

/**
 * Accepts `true` / `false` / `1` / `0` query values and returns a boolean or
 * `undefined` when the parameter was not supplied.
 */
export const optionalBoolean = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return ['true', '1', 'yes'].includes(value.toLowerCase());
  });

export const paginationSchema = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
};

export const moneySchema = z.coerce.number().min(0, 'Use a positive amount.').max(1000000);
