import { z } from 'zod'

/**
 * Domain schemas (camelCase) used by the config-driven form dialogs.
 *
 * The server re-validates every request; these schemas exist to give the user
 * immediate, field-level feedback. `''` is coerced to `null` for optional
 * fields so the API receives clean values.
 */

const optionalText = (max) =>
  z
    .union([z.string().max(max, `Must be ${max} characters or fewer`), z.null()])
    .optional()
    .transform((v) => (v === undefined || v === '' ? null : v))

const optionalDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v === undefined || v === '' ? null : v))

const optionalId = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v === undefined || v === '' ? null : v))

/** Coerce '' / undefined / null to 0, otherwise a whole number in 0..100. */
const progressValue = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
  z
    .number({ invalid_type_error: 'Enter a number' })
    .int('Use a whole number')
    .min(0, 'Minimum is 0')
    .max(100, 'Maximum is 100'),
)

export const TASK_PRIORITY_VALUES = ['low', 'medium', 'high']
export const TASK_STATUS_VALUES = ['not_started', 'in_progress', 'completed']
export const TASK_PLAN_VALUES = ['daily', 'weekly', 'monthly', 'yearly']

export const taskSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(1, 'Title is required')
      .max(200, 'Title must be 200 characters or fewer'),
    description: optionalText(2000),
    notes: optionalText(2000),
    categoryId: optionalId,
    priority: z.enum(TASK_PRIORITY_VALUES).default('medium'),
    status: z.enum(TASK_STATUS_VALUES).default('not_started'),
    plan: z.enum(TASK_PLAN_VALUES).default('daily'),
    startDate: optionalDate,
    deadline: optionalDate,
    progress: progressValue,
  })
  .refine(
    (data) =>
      !data.startDate || !data.deadline || new Date(data.deadline) >= new Date(data.startDate),
    { message: 'Deadline must be on or after the start date', path: ['deadline'] },
  )

export const reportSchema = z.object({
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'),
  completed: optionalText(2000),
  ongoing: optionalText(2000),
  pending: optionalText(2000),
  blockers: optionalText(2000),
  achievements: optionalText(2000),
  tomorrowPlan: optionalText(2000),
})

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Must be 80 characters or fewer'),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, 'Pick a color')
    .default('#0d9488'),
})
