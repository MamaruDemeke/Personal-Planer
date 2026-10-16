import { z } from 'zod'

const bodyText = z.union([z.string().max(5000), z.null()]).optional()

export const createReportSchema = z.object({
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD'),
  completed: bodyText,
  ongoing: bodyText,
  pending: bodyText,
  blockers: bodyText,
  achievements: bodyText,
  tomorrowPlan: bodyText,
})

export const updateReportSchema = z
  .object({
    reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD').optional(),
    completed: bodyText,
    ongoing: bodyText,
    pending: bodyText,
    blockers: bodyText,
    achievements: bodyText,
    tomorrowPlan: bodyText,
  })
  .partial()
