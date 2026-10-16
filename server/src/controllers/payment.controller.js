import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { buildAccess } from '../middleware/access.js'

/** Shape a PostgREST/Postgres error for diagnostics (dev only; see errorHandler). */
function pgDetails(error) {
  if (!error) return undefined
  return { code: error.code, message: error.message, hint: error.hint, details: error.details }
}

/**
 * PostgREST/Postgres codes that mean the required schema has not been created
 * yet (missing table or column). Surfacing these as a setup hint beats the
 * generic "could not save" message.
 */
const SCHEMA_ERROR_CODES = new Set(['PGRST205', 'PGRST202', '42P01', '42703'])

const MIGRATION_HINT =
  'The payment database is not set up yet. Run the SQL migration ' +
  'supabase/migrations/0003_admin_access.sql in the Supabase SQL editor ' +
  '(Dashboard -> SQL Editor), then try again.'

/** Build an internal error, upgrading missing-schema failures to a setup hint. */
function paymentError(message, error) {
  if (error && SCHEMA_ERROR_CODES.has(error.code)) {
    return ApiError.internal(MIGRATION_HINT, pgDetails(error))
  }
  return ApiError.internal(message, pgDetails(error))
}

/**
 * GET /api/payments
 * Returns the caller's access summary plus their recent submissions so the
 * verification screen can show history and status.
 */
export const getPayments = asyncHandler(async (req, res) => {
  const { data, error } = await req.supabase
    .from('payment_submissions')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw paymentError('Could not load your payment history', error)

  res.json({
    data: {
      access: buildAccess(req.profile, req.isAdmin),
      submissions: data ?? [],
    },
  })
})

/**
 * POST /api/payments
 * Records a payment proof (receipt image or transaction number) and moves the
 * account into the `pending` state for admin review.
 */
export const submitPayment = asyncHandler(async (req, res) => {
  const access = buildAccess(req.profile, req.isAdmin)

  if (req.isAdmin) {
    throw ApiError.conflict('Administrators do not need to submit a payment')
  }
  if (access.paymentStatus === 'approved' && !access.accessRevoked) {
    throw ApiError.conflict('Your access is already approved')
  }
  if (access.accessRevoked) {
    throw ApiError.conflict('Your access was revoked. Contact the administrator')
  }

  const { proofType, proofText, proofImage } = req.body

  const { data: submission, error } = await req.supabase
    .from('payment_submissions')
    .insert({
      user_id: req.user.id,
      proof_type: proofType,
      proof_text: proofType === 'transaction' ? (proofText ?? null) : null,
      proof_image: proofType === 'image' ? (proofImage ?? null) : null,
      status: 'pending',
    })
    .select('*')
    .single()

  if (error) throw paymentError('Could not save your payment proof', error)

  const { error: profileError } = await req.supabase
    .from('profiles')
    .update({
      payment_status: 'pending',
      payment_submitted_at: new Date().toISOString(),
      payment_review_note: null,
    })
    .eq('id', req.user.id)

  if (profileError) throw paymentError('Could not update your account status', profileError)

  res.status(201).json({
    data: {
      submission,
      access: buildAccess(
        { ...req.profile, payment_status: 'pending', payment_review_note: null },
        req.isAdmin,
      ),
    },
  })
})
