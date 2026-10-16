import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { buildAccess } from '../middleware/access.js'

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

  if (error) throw ApiError.internal('Could not load your payment history')

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

  if (error) throw ApiError.internal('Could not save your payment proof')

  const { error: profileError } = await req.supabase
    .from('profiles')
    .update({
      payment_status: 'pending',
      payment_submitted_at: new Date().toISOString(),
      payment_review_note: null,
    })
    .eq('id', req.user.id)

  if (profileError) throw ApiError.internal('Could not update your account status')

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
