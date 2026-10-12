import { Router } from 'express'
import healthRoutes from './health.routes.js'
import authRoutes from './auth.routes.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/auth', authRoutes)

// Resource routers are mounted here as each phase is implemented:
// router.use('/tasks', tasksRoutes)
// router.use('/categories', categoriesRoutes)
// router.use('/projects', projectsRoutes)
// router.use('/goals', goalsRoutes)
// router.use('/events', eventsRoutes)
// router.use('/notes', notesRoutes)
// router.use('/reminders', remindersRoutes)
// router.use('/reports', reportsRoutes)

export default router
