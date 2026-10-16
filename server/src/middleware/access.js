import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { env } from '../config/env.js'
import { getAdminClient } from '../config/supabase.js'

/**
 * Derive a serialisable summary of a user's access state from their profile.
 * `reason` is null when the user may use the app, otherwise one of:
 * 'none' | 'pending' | 'rejected' | 'expired' | 'revoked'.
 */
export function buildAccess(profile, isAdmin) {
  const status = profile?.payment_status ?? 'none'
  const revoked = Boolean(profile?.access_revoked)
  const approvedUntil = profile?.approved_until ?? null
  const expired = approvedUntil ? new Date(approvedUntil).getTime() <= Date.now() : false

  let reason = null
  if (revoked) reason = 'revoked'
  else if (status === 'approved') reason = expired ? 'expired' : null
  else reason = status

  return {
    id: profile?.id ?? null,
    role: profile?.role ?? 'user',
    isAdmin: Boolean(isAdmin),
    paymentStatus: status,
    accessRevoked: revoked,
    approvedUntil,
    paymentReviewNote: profile?.payment_review_note ?? null,
    paymentSubmittedAt: profile?.payment_submitted_at ?? null,
    paymentReviewedAt: profile?.payment_reviewed_at ?? null,
    canUse: Boolean(isAdmin) || reason === null,
    reason,
  }
}

/**
 * Loads the caller's profile (via their own RLS-scoped client) and attaches
 * `req.profile`, `req.isAdmin` and `req.access`. Must run after `requireAuth`.
 *
 * When the account's email is listed in ADMIN_EMAILS it is promoted to
 * `role = 'admin'` on first sight (best effort - needs the service-role key).
 */
export const loadProfile = asyncHandler(async (req, _res, next) => {
  const email = (req.user?.email ?? '').toLowerCase()
  const envAdmin = email !== '' && env.adminEmails.includes(email)

  const { data, error } = await req.supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .maybeSingle()

  if (error) throw ApiError.internal('Could not load your profile')

  let profile = data

  if (envAdmin && profile && profile.role !== 'admin') {
    try {
      const admin = getAdminClient()
      const { data: promoted, error: promoteError } = await admin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', req.user.id)
        .select('*')
        .maybeSingle()
      if (!promoteError && promoted) profile = promoted
    } catch {
      // Service-role key not configured: the env match still grants admin.
    }
  }

  req.profile = profile
  req.isAdmin = Boolean(envAdmin || profile?.role === 'admin')
  req.access = buildAccess(profile, req.isAdmin)
  next()
})

const LOCK_MESSAGES = {
  none: 'Submit your payment receipt to unlock the app',
  pending: 'Your payment is awaiting administrator approval',
  rejected: 'Your payment was rejected. Submit a new receipt to continue',
  expired: 'Your access period has expired. Renew it to continue',
  revoked: 'Your access has been revoked. Contact the administrator',
}

/** Blocks locked (unpaid / unapproved) accounts from the protected routes. */
export function requireApproved(req, _res, next) {
  const access = req.access ?? buildAccess(req.profile, req.isAdmin)
  if (access.canUse) return next()

  next(
    new ApiError(403, LOCK_MESSAGES[access.reason] ?? 'Access is locked', {
      code: `ACCESS_${String(access.reason ?? 'locked').toUpperCase()}`,
      reason: access.reason,
      paymentStatus: access.paymentStatus,
      approvedUntil: access.approvedUntil,
    }),
  )
}

/** Restricts a route to administrators. */
export function requireAdmin(req, _res, next) {
  if (req.isAdmin) return next()
  next(ApiError.forbidden('Administrator access required'))
}
