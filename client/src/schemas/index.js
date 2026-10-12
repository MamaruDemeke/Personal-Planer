import { z } from 'zod'
import {
  GOAL_STATUSES,
  PLAN_PERIODS,
  PLAN_STATUSES,
  PRIORITIES,
  PROJECT_STATUSES,
  REMINDER_CHANNELS,
  REMINDER_STATUSES,
  TASK_STATUSES,
} from '@/lib/constants'

/**
 * Zod schemas for every module. Field names are camelCase to match the
 * application model; the resource-store layer converts them to snake_case for
 * the database. `''` is accepted for optional date/enum fields and coerced to
 * `null` by the form dialog before persisting.
 */

const optionalDate = z
  .string()
  .transform((v) => (v === '' || v === undefined || v === null ? null : v))
  .nullish()
  .default(null)
  .nullable()
const optionalId = z
  .string()
  .transform((v) => (v === '' || v === undefined || v === null ? null : v))
  .nullish()
  .default(null)
  .nullable()
const optionalText = (max) =>
  z.string().trim().max(max, `Must be ${max} characters or fewer`).optional().default('')

/** Coerce '' / undefined / null to null, otherwise to a number. */
const numberOrNull = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
  z.number().min(0, 'Must be zero or greater').nullable(),
)

/** Coerce '' / undefined / null to `def`, otherwise to a number >= 0. */
const numberDefault = (def) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? def : Number(v)),
    z.number().min(0, 'Must be zero or greater'),
  )

export const taskSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or fewer'),
  description: optionalText(2000),
  priority: z.enum(PRIORITIES).default('medium'),
  status: z.enum(TASK_STATUSES).default('todo'),
  categoryId: optionalId,
  projectId: optionalId,
  dueDate: optionalDate,
  estimatedMinutes: numberOrNull,
})

export const categorySchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(1, 'Name is required')
    .max(80, 'Name must be 80 characters or fewer'),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, 'Enter a valid hex color')
    .default('#0d9488'),
  description: optionalText(500),
})

export const projectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name must be 120 characters or fewer'),
  description: optionalText(2000),
  status: z.enum(PROJECT_STATUSES).default('active'),
  startDate: optionalDate,
  deadline: optionalDate,
})

export const goalSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(160, 'Title must be 160 characters or fewer'),
  description: optionalText(2000),
  status: z.enum(GOAL_STATUSES).default('active'),
  targetDate: optionalDate,
  targetValue: numberOrNull,
  currentValue: numberDefault(0),
  progress: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
    z.number().int('Use a whole number').min(0, 'Minimum is 0').max(100, 'Maximum is 100'),
  ),
})

export const milestoneSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(160, 'Title must be 160 characters or fewer'),
  goalId: z.string().min(1, 'Goal is required'),
  dueDate: optionalDate,
  completed: z.boolean().default(false),
})

export const eventSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(160, 'Title must be 160 characters or fewer'),
  description: optionalText(2000),
  projectId: optionalId,
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  allDay: z.boolean().default(false),
})

export const noteSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(160, 'Title must be 160 characters or fewer'),
  content: optionalText(20000),
  categoryId: optionalId,
  tags: z.array(z.string()).optional().default([]),
})

export const reminderSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(200, 'Message must be 200 characters or fewer'),
  taskId: optionalId,
  eventId: optionalId,
  remindAt: z.string().min(1, 'Reminder time is required'),
  channel: z.enum(REMINDER_CHANNELS).default('in_app'),
  status: z.enum(REMINDER_STATUSES).default('pending'),
})

/**
 * A plan is a time-bounded container (daily/weekly/monthly/yearly) whose
 * progress is derived from its linked tasks. `actualResults` and the final
 * percentage are captured through the completion dialog rather than this form.
 */
export const planSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or fewer'),
  description: optionalText(2000),
  period: z.enum(PLAN_PERIODS).default('weekly'),
  priority: z.enum(PRIORITIES).default('medium'),
  status: z.enum(PLAN_STATUSES).default('active'),
  startDate: optionalDate,
  deadline: optionalDate,
  expectedResults: optionalText(2000),
})

/** Payload for marking a plan complete (captured by the completion dialog). */
export const planCompletionSchema = z.object({
  actualResults: optionalText(2000),
})
