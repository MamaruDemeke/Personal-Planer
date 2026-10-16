import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/services/api'

/**
 * The signed-in user's role and payment/access state. Loaded once per session
 * (and refreshed after submitting a payment) to drive the routing gate and the
 * visibility of the admin area.
 */
export const useAccessStore = defineStore('access', () => {
  const summary = ref(null)
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref(null)

  async function load(force = false) {
    if (loaded.value && !force) return summary.value
    if (loading.value) return summary.value
    loading.value = true
    error.value = null
    try {
      summary.value = await api.get('/auth/access')
      loaded.value = true
      return summary.value
    } catch (err) {
      if (err?.status !== 401) error.value = err?.message ?? 'Could not check your access'
      return summary.value
    } finally {
      loading.value = false
    }
  }

  function setSummary(next) {
    summary.value = next
    loaded.value = true
  }

  function invalidate() {
    summary.value = null
    loaded.value = false
    error.value = null
  }

  const isAdmin = computed(() => Boolean(summary.value?.isAdmin))
  const canUse = computed(() => Boolean(summary.value?.canUse))
  const paymentStatus = computed(() => summary.value?.paymentStatus ?? 'none')
  const reason = computed(() => summary.value?.reason ?? null)
  const isLocked = computed(() => loaded.value && !isAdmin.value && !canUse.value)

  return {
    summary,
    loading,
    loaded,
    error,
    load,
    setSummary,
    invalidate,
    isAdmin,
    canUse,
    paymentStatus,
    reason,
    isLocked,
  }
})
