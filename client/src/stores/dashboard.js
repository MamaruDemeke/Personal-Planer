import { ref } from 'vue'
import { defineStore } from 'pinia'
import { endOfDay, startOfDay } from 'date-fns'
import { api } from '@/services/api'

/**
 * Dashboard data: aggregated statistics (derived server-side from the user's
 * tasks) plus the tasks scheduled for today (fetched in the user's local day
 * boundaries so "today" matches their timezone).
 */
export const useDashboardStore = defineStore('dashboard', () => {
  const summary = ref(null)
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref(null)

  async function load({ force = false } = {}) {
    if (loaded.value && !force) return summary.value
    loading.value = true
    error.value = null
    try {
      const from = startOfDay(new Date()).toISOString()
      const to = endOfDay(new Date()).toISOString()
      const [data, todayTasks] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/tasks', { from, to, sort: 'deadline', order: 'asc' }),
      ])
      summary.value = { ...data, todayTasks: todayTasks ?? [] }
      loaded.value = true
      return summary.value
    } catch (err) {
      error.value = err?.message ?? 'Failed to load dashboard'
      throw err
    } finally {
      loading.value = false
    }
  }

  function invalidate() {
    loaded.value = false
  }

  return { summary, loading, loaded, error, load, invalidate }
})
