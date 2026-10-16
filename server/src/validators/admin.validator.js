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
    fullName: z.string().trim().max(120).nullish(),
  })
  .refine(
    (value) =>
      value.role !== undefined || value.accessRevoked !== undefined || value.fullName !== undefined,
    {
      message: 'Nothing to update',
    },
  )

export const createUserSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
  fullName: z.string().trim().max(120).nullish(),
  role: z.enum(['user', 'admin']).optional(),
  accessDays,
  grantAccess: z.boolean().optional(),
})

export const listPaymentsQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
})
