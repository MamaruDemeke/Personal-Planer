import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { tryGetAdminClient } from '../config/supabase.js'

const ACCESS_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Prefer the service-role client (bypasses RLS) when configured; otherwise fall
 * back to the administrator's own client, where RLS `is_admin()` policies apply.
 */
function db(req) {
  return tryGetAdminClient() ?? req.supabase
}

function resolveApprovedUntil(accessDays) {
  if (!accessDays) return null
  return new Date(Date.now() + accessDays * ACCESS_DAY_MS).toISOString()
}

/** Latest submission per user id. */
function latestByUser(submissions) {
  const map = new Map()
  for (const submission of submissions) {
    if (!map.has(submission.user_id)) map.set(submission.user_id, submission)
  }
  return map
}

/**
 * GET /api/admin/users
 * Every account with its role, access state and most recent payment proof.
 * Administrators are enforced by RLS (`is_admin()`), so the caller's own
 * client is used - no service-role key required.
 */
export const listUsers = asyncHandler(async (req, res) => {
  const [{ data: profiles, error: profileError }, { data: submissions, error: submissionError }] =
    await Promise.all([
      db(req).from('profiles').select('*').order('created_at', { ascending: false }),
      db(req)
        .from('payment_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500),
    ])

  if (profileError) throw ApiError.internal('Could not load users')
  if (submissionError) throw ApiError.internal('Could not load payment submissions')

  const latest = latestByUser(submissions ?? [])

  const users = (profiles ?? []).map((profile) => ({
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    createdAt: profile.created_at,
    role: profile.role,
    paymentStatus: profile.payment_status,
    accessRevoked: profile.access_revoked,
    approvedUntil: profile.approved_until,
    paymentReviewNote: profile.payment_review_note,
    paymentSubmittedAt: profile.payment_submitted_at,
    paymentReviewedAt: profile.payment_reviewed_at,
    lastSubmission: latest.get(profile.id) ?? null,
  }))

  const counts = users.reduce(
    (acc, user) => {
      acc.total += 1
      if (user.accessRevoked) acc.revoked += 1
      else if (user.paymentStatus === 'pending') acc.pending += 1
      else if (user.paymentStatus === 'approved') acc.approved += 1
      else acc.locked += 1
      return acc
    },
    { total: 0, pending: 0, approved: 0, locked: 0, revoked: 0 },
  )

  res.json({ data: { users, counts } })
})

/**
 * GET /api/admin/payments?status=pending
 * The review queue. Each row is joined with the submitting account's email.
 */
export const listPayments = asyncHandler(async (req, res) => {
  let query = db(req)
    .from('payment_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (req.query.status) query = query.eq('status', req.query.status)

  const { data: submissions, error } = await query
  if (error) throw ApiError.internal('Could not load payment submissions')

  const userIds = [...new Set((submissions ?? []).map((row) => row.user_id))]
  let emails = new Map()
  if (userIds.length) {
    const { data: profiles } = await db(req)
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)
    emails = new Map((profiles ?? []).map((p) => [p.id, p]))
  }

  const payments = (submissions ?? []).map((row) => {
    const owner = emails.get(row.user_id)
    return {
      ...row,
      userEmail: owner?.email ?? null,
      userName: owner?.full_name ?? null,
    }
  })

  res.json({ data: { payments } })
})

/**
 * POST /api/admin/payments/:id/approve
 * Approves a submission, unlocks the account and (optionally) sets an expiry.
 */
export const approvePayment = asyncHandler(async (req, res) => {
  const { note = null, accessDays = null } = req.body
  const now = new Date().toISOString()

  const { data: submission, error: readError } = await db(req)
    .from('payment_submissions')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle()

  if (readError) throw ApiError.internal('Could not load the submission')
  if (!submission) throw ApiError.notFound('Payment submission not found')
  if (submission.status === 'approved') throw ApiError.conflict('This payment is already approved')

  const { error: updateError } = await db(req)
    .from('payment_submissions')
    .update({
      status: 'approved',
      reviewer_note: note,
      reviewed_by: req.user.id,
      reviewed_at: now,
    })
    .eq('id', submission.id)

  if (updateError) throw ApiError.internal('Could not approve the submission')

  const { error: profileError } = await db(req)
    .from('profiles')
    .update({
      payment_status: 'approved',
      access_revoked: false,
      approved_until: resolveApprovedUntil(accessDays),
      payment_review_note: note,
      payment_reviewed_at: now,
    })
    .eq('id', submission.user_id)

  if (profileError) throw ApiError.internal('Could not update the account')

  res.json({ data: { approved: true, userId: submission.user_id } })
})

/**
 * POST /api/admin/payments/:id/reject
 * Rejects a submission and locks the account until a new receipt is submitted.
 */
export const rejectPayment = asyncHandler(async (req, res) => {
  const { note = null } = req.body
  const now = new Date().toISOString()

  const { data: submission, error: readError } = await db(req)
    .from('payment_submissions')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle()

  if (readError) throw ApiError.internal('Could not load the submission')
  if (!submission) throw ApiError.notFound('Payment submission not found')

  const { error: updateError } = await db(req)
    .from('payment_submissions')
    .update({ status: 'rejected', reviewer_note: note, reviewed_by: req.user.id, reviewed_at: now })
    .eq('id', submission.id)

  if (updateError) throw ApiError.internal('Could not reject the submission')

  const { error: profileError } = await db(req)
    .from('profiles')
    .update({
      payment_status: 'rejected',
      approved_until: null,
      payment_review_note: note,
      payment_reviewed_at: now,
    })
    .eq('id', submission.user_id)

  if (profileError) throw ApiError.internal('Could not update the account')

  res.json({ data: { rejected: true, userId: submission.user_id } })
})

/**
 * POST /api/admin/users/:id/grant
 * Grants access without a submission (manual approval / membership renewal).
 */
export const grantAccess = asyncHandler(async (req, res) => {
  const { note = null, accessDays = null } = req.body
  const now = new Date().toISOString()

  const { data, error } = await db(req)
    .from('profiles')
    .update({
      payment_status: 'approved',
      access_revoked: false,
      approved_until: resolveApprovedUntil(accessDays),
      payment_review_note: note,
      payment_reviewed_at: now,
    })
    .eq('id', req.params.id)
    .select('*')
    .maybeSingle()

  if (error) throw ApiError.internal('Could not grant access')
  if (!data) throw ApiError.notFound('User not found')

  res.json({ data: { user: data } })
})

/**
 * PATCH /api/admin/users/:id
 * Changes an account's role and/or revokes (or restores) its access.
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { role, accessRevoked } = req.body
  const patch = {}
  if (role !== undefined) patch.role = role
  if (accessRevoked !== undefined) patch.access_revoked = accessRevoked

  const { data, error } = await db(req)
    .from('profiles')
    .update(patch)
    .eq('id', req.params.id)
    .select('*')
    .maybeSingle()

  if (error) throw ApiError.internal('Could not update the user')
  if (!data) throw ApiError.notFound('User not found')

  res.json({ data: { user: data } })
})
