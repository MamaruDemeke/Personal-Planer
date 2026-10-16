import { ApiError } from '../utils/ApiError.js'
import { buildAccess } from '../middleware/access.js'

/**
 * GET /api/auth/me - returns the authenticated user's basic identity.
 * Requires a valid Supabase access token.
 */
export function getMe(req, res) {
  if (!req.user) throw ApiError.unauthorized()
  res.json({
    data: {
      user: {
        id: req.user.id,
        email: req.user.email ?? null,
        fullName: req.user.user_metadata?.full_name ?? null,
        createdAt: req.user.created_at ?? null,
      },
    },
  })
}

/**
 * GET /api/auth/access - the caller's role, admin flag and payment/access
 * state. Drives routing and the verification gate on the client.
 */
export function getAccess(req, res) {
  if (!req.user) throw ApiError.unauthorized()
  res.json({ data: buildAccess(req.profile, req.isAdmin) })
}
