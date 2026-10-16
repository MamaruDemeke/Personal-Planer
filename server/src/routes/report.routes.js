import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { createReportSchema, updateReportSchema } from '../validators/report.validator.js'
import {
  listReports,
  getReportByDate,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  suggestReport,
} from '../controllers/report.controller.js'

const router = Router()

router.use(requireAuth)

router.route('/').get(listReports).post(validate(createReportSchema), createReport)
router.get('/suggest', suggestReport)
router.get('/date/:date', getReportByDate)
router
  .route('/:id')
  .get(getReport)
  .patch(validate(updateReportSchema), updateReport)
  .delete(deleteReport)

export default router
