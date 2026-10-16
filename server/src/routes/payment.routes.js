import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { submitPaymentSchema } from '../validators/payment.validator.js'
import { getPayments, submitPayment } from '../controllers/payment.controller.js'

const router = Router()

router.get('/', getPayments)
router.post('/', validate(submitPaymentSchema), submitPayment)

export default router
