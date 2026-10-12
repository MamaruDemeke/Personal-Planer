import rateLimit from 'express-rate-limit'

/** General API rate limiter. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Too many requests, please try again later.' } },
})

/** Stricter limiter for auth-sensitive endpoints. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Too many attempts, please try again later.' } },
})
