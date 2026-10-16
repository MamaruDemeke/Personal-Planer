import { ApiError } from '../utils/ApiError.js'
import { supabase, supabaseConfigured, getUserClient } from '../config/supabase.js'

/**
 * Express middleware that authenticates a request via a Supabase access token.
 *
 * The client must send `Authorization: Bearer <access_token>`. The token is
 * verified with Supabase Auth; on success `req.user` (the auth user) and
 * `req.supabase` (a user-scoped client) are attached. The client-supplied user
 * id is never trusted — only the verified token is used.
 */
export async function requireAuth(req, _res, next) {
  try {
    // Already authenticated by an upstream middleware in this request chain.
    if (req.user && req.supabase) return next()

    if (!supabaseConfigured) {
      throw new ApiError(503, 'Authentication is not configured on the server')
    }

    const header = req.headers.authorization ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null
    if (!token) throw ApiError.unauthorized('Missing bearer token')

    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) throw ApiError.unauthorized('Invalid or expired token')

    req.user = data.user
    req.accessToken = token
    req.supabase = getUserClient(token)
    next()
  } catch (err) {
    next(err)
  }
}
