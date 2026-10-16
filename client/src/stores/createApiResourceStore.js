import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'

/**
 * Factory building a Pinia store with full CRUD for one REST resource.
 *
 * Data isolation is enforced server-side (RLS); the client never sends a
 * `user_id`.
 *
 * @param {string} id          Pinia store id, e.g. 'tasks'
 * @param {{ basePath: string }} options  API path, e.g. '/tasks'
 */
export function createApiResourceStore(id, { basePath }) {
  return defineStore(id, () => {
    const items = ref([])
    const loading = ref(false)
    const error = ref(null)
    const loaded = ref(false)

    async function load(params = {}, { force = false } = {}) {
      if (loaded.value && !force) return items.value
      loading.value = true
      error.value = null
      try {
        items.value = (await api.get(basePath, params)) ?? []
        loaded.value = true
        return items.value
      } catch (err) {
        error.value = err?.message ?? `Failed to load ${basePath}`
        throw err
      } finally {
        loading.value = false
      }
    }

    async function create(payload) {
      const row = await api.post(basePath, payload)
      items.value = [row, ...items.value]
      loaded.value = true
      return row
    }

    async function update(idValue, payload) {
      const row = await api.patch(`${basePath}/${idValue}`, payload)
      items.value = items.value.map((item) => (item.id === idValue ? row : item))
      return row
    }

    async function remove(idValue) {
      await api.delete(`${basePath}/${idValue}`)
      items.value = items.value.filter((item) => item.id !== idValue)
    }

    /** Reset the loaded flag so the next `load()` refetches. */
    function invalidate() {
      loaded.value = false
    }

    return { items, loading, error, loaded, load, create, update, remove, invalidate }
  })
}
