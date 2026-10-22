import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/services/api'

const DISMISSED_KEY = 'mezgab-notifications-dismissed'

function loadDismissed() {
  try {
    const raw = JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]')
    return new Set(Array.isArray(raw) ? raw : [])
  } catch {
    return new Set()
  }
}

function persistDismissed(set) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]))
  } catch {
    /* Storage may be unavailable - dismissals still work in-memory. */
  }
}

/**
 * Server-side notifications: for administrators these are pending payment
 * verifications; for everyone else the outcome of their submissions.
 *
 * Dismissed notifications are removed from the list (and from the badge
 * counter) and stay hidden on the next reload.
 */
export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref([])
  const dismissed = ref(loadDismissed())
  const loading = ref(false)

  /** Notifications the user has not dismissed yet. */
  const visibleItems = computed(() => items.value.filter((item) => !dismissed.value.has(item.id)))
  const pendingCount = computed(
    () => visibleItems.value.filter((item) => item.type === 'payment_pending').length,
  )
  const count = computed(() => pendingCount.value)

  async function load() {
    loading.value = true
    try {
      const data = await api.get('/notifications')
      items.value = data?.items ?? []
    } catch {
      /* silent - notifications are best-effort */
    } finally {
      loading.value = false
    }
  }

  /** Hide one notification (it is deleted from the list for good). */
  function dismiss(id) {
    if (!id) return
    dismissed.value = new Set([...dismissed.value, id])
    persistDismissed(dismissed.value)
  }

  /** Hide every notification currently listed. */
  function dismissAll() {
    const ids = items.value.map((item) => item.id)
    if (!ids.length) return
    dismissed.value = new Set([...dismissed.value, ...ids])
    persistDismissed(dismissed.value)
  }

  function reset() {
    items.value = []
  }

  return {
    items,
    visibleItems,
    dismissed,
    pendingCount,
    count,
    loading,
    load,
    dismiss,
    dismissAll,
    reset,
  }
})
