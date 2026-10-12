import { Router } from 'express'

const router = Router()

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Liveness probe
 */
router.get('/', (_req, res) => {
  res.json({
    data: {
      status: 'ok',
      service: 'planora-api',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  })
})

export default router
