import { z } from 'zod'

const dataImage = z
  .string()
  .min(32, 'The receipt image looks empty')
  .max(2_000_000, 'The receipt image is too large (max ~1.5 MB)')
  .regex(/^data:image\/(png|jpe?g|webp|gif);base64,/, 'Upload a PNG, JPG, WEBP or GIF image')

export const submitPaymentSchema = z
  .object({
    proofType: z.enum(['image', 'transaction']),
    proofText: z.string().trim().min(3).max(120).nullish(),
    proofImage: dataImage.nullish(),
  })
  .refine((value) => (value.proofType === 'image' ? Boolean(value.proofImage) : Boolean(value.proofText)), {
    message: 'Provide the required proof for the selected type',
    path: ['proofText'],
  })
