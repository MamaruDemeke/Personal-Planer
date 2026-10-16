import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'

/**
 * Progress & report analytics derived server-side from the user's tasks:
 * completion percentages, real completion times, delayed tasks and daily or
 * weekly rollups.
 */
export const useProgressStore = defineStore('progress', () => {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function load(period = 'daily', { force = false } = {}) {
    if (data.value && data.value.period === period && !force) return data.value
    loading.value = true
    error.value = null
    try {
      data.value = await api.get('/progress', { period })
      return data.value
    } catch (err) {
      error.value = err?.message ?? 'Failed to load progress'
      throw err
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, load }
})
