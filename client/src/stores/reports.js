import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'

/** Daily work reports, keyed by date. POST is an upsert on (user, date). */
export const useReportsStore = defineStore('reports', () => {
  const items = ref([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref(null)

  async function load(params = {}, { force = false } = {}) {
    if (loaded.value && !force) return items.value
    loading.value = true
    error.value = null
    try {
      items.value = (await api.get('/reports', params)) ?? []
      loaded.value = true
      return items.value
    } catch (err) {
      error.value = err?.message ?? 'Failed to load reports'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** @param {string} date YYYY-MM-DD @param {string} period */
  function getByDate(date, period = 'daily') {
    return api.get(`/reports/date/${date}`, { period })
  }

  /** @param {string} date YYYY-MM-DD @param {string} period */
  function suggest(date, period = 'daily') {
    return api.get('/reports/suggest', { date, period })
  }

  async function save(payload) {
    const row = await api.post('/reports', payload)
    const idx = items.value.findIndex((r) => r.id === row.id)
    if (idx === -1) items.value = [row, ...items.value]
    else items.value = items.value.map((r) => (r.id === row.id ? row : r))
    loaded.value = true
    return row
  }

  async function update(idValue, payload) {
    const row = await api.patch(`/reports/${idValue}`, payload)
    items.value = items.value.map((r) => (r.id === idValue ? row : r))
    return row
  }

  async function remove(idValue) {
    await api.delete(`/reports/${idValue}`)
    items.value = items.value.filter((r) => r.id !== idValue)
  }

  function invalidate() {
    loaded.value = false
  }

  return { items, loading, loaded, error, load, getByDate, suggest, save, update, remove, invalidate }
})
