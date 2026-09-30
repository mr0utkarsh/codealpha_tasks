import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty.')
    .max(2000, 'Comment must be at most 2000 characters.'),
});

export const addMemberSchema = z.object({
  userId: z.string().min(1, 'Select a user to add.'),
  role: z.enum(['ADMIN', 'MEMBER']).optional().default('MEMBER'),
});
