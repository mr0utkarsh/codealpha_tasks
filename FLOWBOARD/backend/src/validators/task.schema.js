import { z } from 'zod';
import { optionalDate } from './project.schema.js';

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const nullableId = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.string().min(1).nullable()
);

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Task title must be at least 3 characters.')
    .max(150, 'Task title must be at most 150 characters.'),
  description: z
    .string()
    .trim()
    .max(5000, 'Description must be at most 5000 characters.')
    .optional()
    .default(''),
  status: z.enum(TASK_STATUSES).optional().default('TODO'),
  priority: z.enum(TASK_PRIORITIES).optional().default('MEDIUM'),
  dueDate: optionalDate,
  assigneeId: nullableId,
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Task title must be at least 3 characters.')
    .max(150, 'Task title must be at most 150 characters.')
    .optional(),
  description: z
    .string()
    .trim()
    .max(5000, 'Description must be at most 5000 characters.')
    .optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: z.preprocess(
    (value) => (value === '' ? null : value),
    z.coerce.date().nullable().optional()
  ),
  assigneeId: nullableId.optional(),
  position: z.number().finite().min(0).optional(),
});

export const listTasksQuerySchema = z.object({
  q: z.string().trim().max(100).optional().default(''),
  status: z.enum([...TASK_STATUSES, 'ALL']).optional().default('ALL'),
  priority: z.enum([...TASK_PRIORITIES, 'ALL']).optional().default('ALL'),
  assignee: z.string().trim().max(100).optional().default(''),
});
