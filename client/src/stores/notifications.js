import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/services/api'

/**
 * Server-side notifications: for administrators these are pending payment
 * verifications; for everyone else the outcome of their submissions.
 */
export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref([])
  const pendingCount = ref(0)
  const loading = ref(false)

  const count = computed(() => pendingCount.value)

  async function load() {
    loading.value = true
    try {
      const data = await api.get('/notifications')
      items.value = data?.items ?? []
      pendingCount.value = data?.pendingCount ?? 0
    } catch {
      /* silent - notifications are best-effort */
    } finally {
      loading.value = false
    }
  }

  function reset() {
    items.value = []
    pendingCount.value = 0
  }

  return { items, pendingCount, count, loading, load, reset }
})
