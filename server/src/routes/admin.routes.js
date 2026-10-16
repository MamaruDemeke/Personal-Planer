import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import {
  createUserSchema,
  grantAccessSchema,
  listPaymentsQuerySchema,
  reviewPaymentSchema,
  updateUserSchema,
} from '../validators/admin.validator.js'
import {
  approvePayment,
  createUser,
  deleteUser,
  grantAccess,
  listPayments,
  listUsers,
  rejectPayment,
  updateUser,
} from '../controllers/admin.controller.js'

const router = Router()

router.get('/users', listUsers)
router.post('/users', validate(createUserSchema), createUser)
router.patch('/users/:id', validate(updateUserSchema), updateUser)
router.delete('/users/:id', deleteUser)
router.post('/users/:id/grant', validate(grantAccessSchema), grantAccess)

router.get('/payments', validate(listPaymentsQuerySchema, 'query'), listPayments)
router.post('/payments/:id/approve', validate(reviewPaymentSchema), approvePayment)
router.post('/payments/:id/reject', validate(reviewPaymentSchema), rejectPayment)

export default router
