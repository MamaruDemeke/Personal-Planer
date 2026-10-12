import { ApiError } from '../utils/ApiError.js'

/**
 * GET /api/auth/me — returns the authenticated user's basic identity.
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
