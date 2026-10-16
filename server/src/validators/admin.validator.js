import { z } from 'zod'

const accessDays = z.number().int().min(1).max(3650).nullish()

const reviewNote = z.string().trim().max(500).nullish()

export const reviewPaymentSchema = z.object({
  note: reviewNote,
  accessDays,
})

export const grantAccessSchema = z.object({
  note: reviewNote,
  accessDays,
})

export const updateUserSchema = z
  .object({
    role: z.enum(['user', 'admin']).optional(),
    accessRevoked: z.boolean().optional(),
  })
  .refine((value) => value.role !== undefined || value.accessRevoked !== undefined, {
    message: 'Nothing to update',
  })

export const listPaymentsQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
})
