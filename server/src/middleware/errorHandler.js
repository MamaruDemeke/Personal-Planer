import { ZodError } from 'zod'
import { ApiError } from '../utils/ApiError.js'
import { isProduction } from '../config/env.js'

/** 404 handler for unmatched routes. */
export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`))
}

/** Centralised error handler. Never leaks secrets or stack traces in production. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let statusCode = 500
  let message = 'Internal server error'
  let details

  if (err instanceof ApiError) {
    statusCode = err.statusCode
    message = err.message
    details = err.details
  } else if (err instanceof ZodError) {
    statusCode = 422
    message = 'Validation failed'
    details = err.issues?.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
  } else if (err?.name === 'ValidationError') {
    statusCode = 422
    message = err.message
  }

  if (statusCode >= 500 && !isProduction) {
    // Surface unexpected server errors during development only.
    message = err?.message || message
  }

  if (statusCode >= 500) {
    // Log server-side (never send internals to the client).
    console.error(err)
  }

  res.status(statusCode).json({
    error: {
      message,
      ...(details && (statusCode < 500 || !isProduction) ? { details } : {}),
    },
  })
}
