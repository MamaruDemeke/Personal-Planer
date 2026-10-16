import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getMe, getAccess } from '../controllers/auth.controller.js'

const router = Router()

router.get('/me', requireAuth, getMe)
router.get('/access', requireAuth, getAccess)

export default router
