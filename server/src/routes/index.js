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

import { requireAuth } from '../middleware/auth.js'
import { loadProfile, requireAdmin, requireApproved } from '../middleware/access.js'

const router = Router()

router.use('/health', healthRoutes)

// Signed in, but usable whether or not access has been approved yet.
router.use('/auth', requireAuth, loadProfile, authRoutes)
router.use('/payments', requireAuth, loadProfile, paymentRoutes)
router.use('/notifications', requireAuth, loadProfile, notificationRoutes)

// Administrator-only.
router.use('/admin', requireAuth, loadProfile, requireAdmin, adminRoutes)

// The planner itself stays locked until an administrator approves the account.
router.use('/tasks', requireAuth, loadProfile, requireApproved, taskRoutes)
router.use('/categories', requireAuth, loadProfile, requireApproved, categoryRoutes)
router.use('/reports', requireAuth, loadProfile, requireApproved, reportRoutes)
router.use('/dashboard', requireAuth, loadProfile, requireApproved, dashboardRoutes)
router.use('/progress', requireAuth, loadProfile, requireApproved, progressRoutes)

export default router
