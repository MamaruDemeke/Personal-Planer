import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { env, isProduction } from './config/env.js'
import { apiLimiter } from './middleware/rateLimit.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import routes from './routes/index.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(helmet())
  app.use(
    cors({
      origin(origin, callback) {
        // Allow same-origin / server-to-server (no origin) and whitelisted origins.
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true)
        // In development Vite falls back to another port when 5173 is busy (e.g.
        // 5174), so allow any localhost origin instead of breaking the API.
        if (!isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true)
        }
        // Disallowed origin: omit the CORS header (the browser blocks it) rather
        // than throwing, which would surface as a confusing 500.
        return callback(null, false)
      },
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '4mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(morgan(isProduction ? 'combined' : 'dev'))

  app.use('/api', apiLimiter, routes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
