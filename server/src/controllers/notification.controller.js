import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { tryGetAdminClient } from '../config/supabase.js'

function proofLabel(submission) {
  if (submission.proof_type === 'image') return 'Receipt image attached'
  return `Transaction no. ${submission.proof_text}`
}

/**
 * GET /api/notifications
 * Administrators get the payment-verification queue; regular users get the
 * outcome of their own submissions. Powers the notification bell.
 */
export const getNotifications = asyncHandler(async (req, res) => {
  if (req.isAdmin) {
    const db = tryGetAdminClient() ?? req.supabase
    const { data: submissions, error } = await db
      .from('payment_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) throw ApiError.internal('Could not load notifications')

    const userIds = [...new Set((submissions ?? []).map((row) => row.user_id))]
    let owners = new Map()
    if (userIds.length) {
      const { data: profiles } = await db
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds)
      owners = new Map((profiles ?? []).map((p) => [p.id, p]))
    }

    const items = (submissions ?? []).map((submission) => {
      const owner = owners.get(submission.user_id)
      const who = owner?.full_name || owner?.email || 'A user'
      return {
        id: submission.id,
        type: submission.status === 'pending' ? 'payment_pending' : `payment_${submission.status}`,
        title:
          submission.status === 'pending'
            ? `${who} submitted a payment`
            : `${who}'s payment was ${submission.status}`,
        body: proofLabel(submission),
        createdAt: submission.created_at,
        submissionId: submission.id,
        userId: submission.user_id,
        email: owner?.email ?? null,
      }
    })

    res.json({
      data: {
        items,
        pendingCount: items.filter((item) => item.type === 'payment_pending').length,
      },
    })
    return
  }

  const { data: submissions, error } = await req.supabase
    .from('payment_submissions')
    .select('*')
    .eq('user_id', req.user.id)
    .neq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw ApiError.internal('Could not load notifications')

  const items = (submissions ?? []).map((submission) => ({
    id: submission.id,
    type: `payment_${submission.status}`,
    title:
      submission.status === 'approved' ? 'Payment approved' : 'Payment rejected',
    body: submission.reviewer_note || proofLabel(submission),
    createdAt: submission.reviewed_at ?? submission.created_at,
    submissionId: submission.id,
  }))

  res.json({ data: { items, pendingCount: 0 } })
})
