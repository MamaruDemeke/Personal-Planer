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
        return callback(new Error('Not allowed by CORS'))
      },
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(morgan(isProduction ? 'combined' : 'dev'))

  app.use('/api', apiLimiter, routes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
