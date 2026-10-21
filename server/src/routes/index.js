import { Router } from 'express'
import healthRoutes from './health.routes.js'
import authRoutes from './auth.routes.js'
import taskRoutes from './task.routes.js'
import categoryRoutes from './category.routes.js'
import reportRoutes from './report.routes.js'
import dashboardRoutes from './dashboard.routes.js'
import progressRoutes from './progress.routes.js'
import paymentRoutes from './payment.routes.js'
import adminRoutes from './admin.routes.js'
import notificationRoutes from './notification.routes.js'
import noteRoutes from './note.routes.js'

import { requireAuth } from '../middleware/auth.js'
import { loadProfile, requireAdmin, requireApprovedToWrite } from '../middleware/access.js'

const router = Router()

router.use('/health', healthRoutes)

// Signed in, but usable whether or not access has been approved yet.
router.use('/auth', requireAuth, loadProfile, authRoutes)
router.use('/payments', requireAuth, loadProfile, paymentRoutes)
router.use('/notifications', requireAuth, loadProfile, notificationRoutes)
router.use('/notes', requireAuth, loadProfile, noteRoutes)

// Administrator-only.
router.use('/admin', requireAuth, loadProfile, requireAdmin, adminRoutes)

// Browsable by everyone signed in, but locked accounts may only read - writes
// (create / update / delete) stay blocked until an administrator approves.
router.use('/tasks', requireAuth, loadProfile, requireApprovedToWrite, taskRoutes)
router.use('/categories', requireAuth, loadProfile, requireApprovedToWrite, categoryRoutes)
router.use('/reports', requireAuth, loadProfile, requireApprovedToWrite, reportRoutes)
router.use('/dashboard', requireAuth, loadProfile, requireApprovedToWrite, dashboardRoutes)
router.use('/progress', requireAuth, loadProfile, requireApprovedToWrite, progressRoutes)

export default router
