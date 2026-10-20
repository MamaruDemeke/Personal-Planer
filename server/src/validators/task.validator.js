import { z } from 'zod'

export const PRIORITIES = ['low', 'medium', 'high']
export const STATUSES = ['not_started', 'in_progress', 'completed']
export const PLANS = ['daily', 'weekly', 'monthly', 'yearly']
export const RECURRENCES = ['none', 'daily', 'weekly', 'monthly', 'yearly']

/**
 * Dates arrive as ISO strings (the client sends `Date.toISOString()`), are
 * validated as parseable, and `''` is normalised to `null`.
 */
const dateField = z
  .union([z.string(), z.null()])
  .optional()
  .refine((v) => v == null || v === '' || !Number.isNaN(Date.parse(v)), {
    message: 'Invalid date',
  })
  .transform((v) => (v === '' ? null : v))

const text = (max) => z.union([z.string().max(max), z.null()]).optional()

const baseTask = {
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: text(5000),
  notes: text(5000),
  categoryId: z.union([z.string().uuid(), z.null()]).optional(),
  priority: z.enum(PRIORITIES).optional(),
  status: z.enum(STATUSES).optional(),
   plan: z.enum(PLANS).optional(),
   recurrence: z.enum(RECURRENCES).optional(),
   parentId: z.union([z.string().uuid(), z.null()]).optional(),
   startDate: dateField,
  deadline: dateField,
  progress: z.number().int().min(0).max(100).optional(),
}

export const createTaskSchema = z
  .object(baseTask)
  .refine(
    (d) =>
      !d.startDate ||
      !d.deadline ||
      new Date(d.deadline).getTime() >= new Date(d.startDate).getTime(),
    { message: 'Deadline must be on or after the start date', path: ['deadline'] },
  )

export const updateTaskSchema = z
  .object(baseTask)
  .partial()
  .refine(
    (d) =>
      !d.startDate ||
      !d.deadline ||
      new Date(d.deadline).getTime() >= new Date(d.startDate).getTime(),
    { message: 'Deadline must be on or after the start date', path: ['deadline'] },
  )
