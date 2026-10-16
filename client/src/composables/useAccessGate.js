import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAccessStore } from '@/stores/access'
import { useToast } from '@/composables/useToast'

/**
 * Client-side companion to the server's `requireApprovedToWrite` gate.
 *
 * While an account is locked (unpaid, awaiting verification, rejected, expired
 * or revoked) it may browse the app but must not change data. Write controls
 * call `ensureWrite()` first; when locked it explains that the user must submit
 * a payment and wait for an administrator to verify it, and offers a shortcut
 * to the payment page.
 */
export function useAccessGate() {
  const access = useAccessStore()
  const router = useRouter()
  const toast = useToast()

  const isLocked = computed(() => access.isLocked)

  const message = computed(() => {
    switch (access.reason) {
      case 'pending':
        return 'Your payment is awaiting verification by an administrator. You can make changes once it is approved.'
      case 'rejected':
        return (
          access.summary?.paymentReviewNote ||
          'Your last payment was rejected. Submit a new receipt to continue.'
        )
      case 'expired':
        return 'Your access period has expired. Renew your payment to make changes again.'
      case 'revoked':
        return (
          access.summary?.paymentReviewNote ||
          'Your access has been revoked. Contact the administrator to restore it.'
        )
      default:
        return 'Pay and wait for an administrator to verify your account before creating or editing.'
    }
  })

  function goToPayment() {
    router.push({ name: 'access' })
  }

  /**
   * @returns {boolean} true when the write is allowed; false when it was blocked.
   */
  function ensureWrite() {
    if (!isLocked.value) return true
    toast.warning('Verify your payment first', message.value, {
      action: { label: 'Submit payment', onClick: goToPayment },
    })
    return false
  }

  return { isLocked, message, ensureWrite, goToPayment }
}
