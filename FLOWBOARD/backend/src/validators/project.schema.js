import { z } from 'zod';

/** Accepts ISO dates or empty strings and normalises them to Date | null. */
export const optionalDate = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.coerce.date().nullable()
);

export const PROJECT_STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED'];

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Project name must be at least 3 characters.')
    .max(100, 'Project name must be at most 100 characters.'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must be at most 2000 characters.')
    .optional()
    .default(''),
  status: z.enum(PROJECT_STATUSES).optional().default('PLANNING'),
  startDate: optionalDate,
  dueDate: optionalDate,
  memberIds: z.array(z.string().min(1)).max(50).optional().default([]),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Project name must be at least 3 characters.')
    .max(100, 'Project name must be at most 100 characters.')
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must be at most 2000 characters.')
    .optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  startDate: z.preprocess(
    (value) => (value === '' ? null : value),
    z.coerce.date().nullable().optional()
  ),
  dueDate: z.preprocess(
    (value) => (value === '' ? null : value),
    z.coerce.date().nullable().optional()
  ),
});

export const listProjectsQuerySchema = z.object({
  q: z.string().trim().max(100).optional().default(''),
  status: z.enum([...PROJECT_STATUSES, 'ALL']).optional().default('ALL'),
  sort: z.enum(['recent', 'name', 'due']).optional().default('recent'),
});
