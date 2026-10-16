import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator.js'
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js'

const router = Router()

router.use(requireAuth)

router.route('/').get(listCategories).post(validate(createCategorySchema), createCategory)
router
  .route('/:id')
  .patch(validate(updateCategorySchema), updateCategory)
  .delete(deleteCategory)

export default router
