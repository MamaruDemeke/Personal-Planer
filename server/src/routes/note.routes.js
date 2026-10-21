import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { z } from 'zod'
import {
  listNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
} from '../controllers/note.controller.js'

const router = Router()

const noteSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().max(100000).optional(),
})

router.use(requireAuth)
router.route('/').get(listNotes).post(validate(noteSchema), createNote)
router.route('/:id').get(getNote).patch(validate(noteSchema), updateNote).delete(deleteNote)

export default router
