import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { createTaskSchema, updateTaskSchema } from '../validators/task.validator.js'
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/task.controller.js'

const router = Router()

router.use(requireAuth)

router.route('/').get(listTasks).post(validate(createTaskSchema), createTask)
router.route('/:id').get(getTask).patch(validate(updateTaskSchema), updateTask).delete(deleteTask)

export default router
