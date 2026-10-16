import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, 'Enter a valid hex color')
    .optional()
    .default('#0d9488'),
})

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80).optional(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, 'Enter a valid hex color')
    .optional(),
})
