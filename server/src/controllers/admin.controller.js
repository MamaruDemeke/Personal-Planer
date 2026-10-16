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
      // Administrators are not part of the payment workflow - never count them
      // as pending, approved, locked or revoked.
      if (user.role === 'admin') return acc
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

  // Administrators never need payment - keep their submissions out of the queue.
  const { data: adminProfiles } = await db(req).from('profiles').select('id').eq('role', 'admin')
  const adminIds = new Set((adminProfiles ?? []).map((p) => p.id))
  const visible = (submissions ?? []).filter((row) => !adminIds.has(row.user_id))

  const userIds = [...new Set(visible.map((row) => row.user_id))]
  let emails = new Map()
  if (userIds.length) {
    const { data: profiles } = await db(req)
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)
    emails = new Map((profiles ?? []).map((p) => [p.id, p]))
  }

  const payments = visible.map((row) => {
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
  const { role, accessRevoked, fullName } = req.body
  const patch = {}
  if (role !== undefined) patch.role = role
  if (accessRevoked !== undefined) patch.access_revoked = accessRevoked
  if (fullName !== undefined) patch.full_name = fullName

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

/**
 * POST /api/admin/users
 * Creates a brand-new account (email + password) and sets its role and access.
 * Requires the service-role key because it uses the Supabase Auth admin API.
 */
export const createUser = asyncHandler(async (req, res) => {
  const admin = tryGetAdminClient()
  if (!admin) {
    throw new ApiError(
      503,
      'Creating users needs SUPABASE_SERVICE_ROLE_KEY set in the server environment. Add it to server/.env (local) and Vercel (public), then restart.',
    )
  }

  const { email, password, fullName = null, role = 'user', accessDays = null, grantAccess = true } =
    req.body

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (error) throw ApiError.conflict(error.message || 'Could not create the user')
  const created = data?.user
  if (!created) throw ApiError.internal('Could not create the user')

  const now = new Date().toISOString()
  const isAdmin = role === 'admin'
  const approved = isAdmin || grantAccess

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .upsert(
      {
        id: created.id,
        email,
        full_name: fullName,
        role,
        payment_status: approved ? 'approved' : 'none',
        access_revoked: false,
        approved_until: isAdmin ? null : resolveApprovedUntil(accessDays),
        payment_reviewed_at: approved ? now : null,
      },
      { onConflict: 'id' },
    )
    .select('*')
    .maybeSingle()

  if (profileError) throw ApiError.internal('Could not set up the account profile')

  res.status(201).json({ data: { user: profile ?? { id: created.id, email, full_name: fullName } } })
})

/**
 * DELETE /api/admin/users/:id
 * Permanently deletes an account (auth user + profile). Requires the
 * service-role key. Administrators cannot delete their own account here.
 */
export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw ApiError.conflict('You cannot delete your own account')
  }

  const admin = tryGetAdminClient()

  // Preferred path: service-role key configured -> use the Auth admin API.
  if (admin) {
    const { error } = await admin.auth.admin.deleteUser(req.params.id)
    if (error) {
      const status = error.status ?? error.statusCode
      if (status === 404 || /not found|does not exist/i.test(error.message ?? '')) {
        throw ApiError.notFound('User not found')
      }
      throw ApiError.internal(`Could not delete the user: ${error.message ?? 'unknown error'}`, {
        code: error.code,
        status,
      })
    }
    await admin.from('profiles').delete().eq('id', req.params.id)
    return res.json({ data: { deleted: true, userId: req.params.id } })
  }

  // Fallback: no service-role key -> call the SECURITY DEFINER function
  // (migration 0004) with the administrator's own authenticated client.
  const { error } = await req.supabase.rpc('admin_delete_user', { target_id: req.params.id })
  if (error) {
    if (/could not find the function|does not exist|schema cache/i.test(error.message ?? '')) {
      throw new ApiError(
        503,
        'Delete helper is not installed. Run supabase/migrations/0004_admin_delete_user.sql in the Supabase SQL editor, or set SUPABASE_SERVICE_ROLE_KEY.',
      )
    }
    if (error.code === 'P0002' || /user not found/i.test(error.message ?? '')) {
      throw ApiError.notFound('User not found')
    }
    throw ApiError.internal(`Could not delete the user: ${error.message ?? 'unknown error'}`, {
      code: error.code,
    })
  }

  res.json({ data: { deleted: true, userId: req.params.id } })
})
