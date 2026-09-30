import { z } from 'zod';
import { emailSchema, nameSchema, passwordSchema } from './common.js';

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.').max(72, 'Passwords must be 72 characters or fewer.'),
});

export const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    phone: z
      .string()
      .trim()
      .max(30, 'Use 30 characters or fewer.')
      .refine(
        (value) => value === '' || /^[0-9()+\-.\s]{6,30}$/.test(value),
        'Enter a valid phone number.'
      )
      .optional(),
  })
  .refine(
    (value) => value.name !== undefined || value.phone !== undefined,
    'Provide a name or a phone number to update.'
  );

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  newPassword: passwordSchema,
});
