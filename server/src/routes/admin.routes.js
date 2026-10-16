import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import {
  grantAccessSchema,
  listPaymentsQuerySchema,
  reviewPaymentSchema,
  updateUserSchema,
} from '../validators/admin.validator.js'
import {
  approvePayment,
  grantAccess,
  listPayments,
  listUsers,
  rejectPayment,
  updateUser,
} from '../controllers/admin.controller.js'

const router = Router()

router.get('/users', listUsers)
router.patch('/users/:id', validate(updateUserSchema), updateUser)
router.post('/users/:id/grant', validate(grantAccessSchema), grantAccess)

router.get('/payments', validate(listPaymentsQuerySchema, 'query'), listPayments)
router.post('/payments/:id/approve', validate(reviewPaymentSchema), approvePayment)
router.post('/payments/:id/reject', validate(reviewPaymentSchema), rejectPayment)

export default router
