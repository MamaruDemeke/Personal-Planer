import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { toCamel, toSnake, emptyToNull } from '@/lib/case'

/**
 * Factory that builds a Pinia store exposing full CRUD for one Supabase table.
 *
 * Row Level Security restricts every row to the signed-in user; `user_id` is
 * set from the verified session — never from user input.
 *
 * @param {string} id        Pinia store id, e.g. 'tasks'
 * @param {object} options
 * @param {string} options.table   Supabase table name
 * @param {string} [options.order] Column to order by (default created_at desc)
 */
export function createResourceStore(id, options) {
  const { table, order = 'created_at' } = options

  return defineStore(id, () => {
    const items = ref([])
    const loading = ref(false)
    const error = ref(null)
    const loaded = ref(false)

    async function load(force = false) {
      if (loaded.value && !force) return
      loading.value = true
      error.value = null
      try {
        const { data, error: err } = await supabase
          .from(table)
          .select('*')
          .order(order, { ascending: false })
        if (err) throw err
        items.value = data.map(toCamel)
        loaded.value = true
      } catch (err) {
        error.value = err?.message ?? `Failed to load ${table}`
      } finally {
        loading.value = false
      }
    }

    async function create(payload) {
      if (!supabase) throw new Error('Supabase is not configured.')
      const { data: userData, error: userErr } = await supabase.auth.getUser()
      if (userErr || !userData?.user) throw new Error('You must be signed in.')
      const body = toSnake({ ...payload, user_id: userData.user.id })
      const { data, error: err } = await supabase.from(table).insert(body).select().single()
      if (err) throw err
      const row = toCamel(data)
      items.value = [row, ...items.value]
      return row
    }

    async function update(idValue, payload) {
      const { data, error: err } = await supabase
        .from(table)
        .update(toSnake(payload))
        .eq('id', idValue)
        .select()
        .single()
      if (err) throw err
      const row = toCamel(data)
      items.value = items.value.map((item) => (item.id === idValue ? row : item))
      return row
    }

    async function remove(idValue) {
      const { error: err } = await supabase.from(table).delete().eq('id', idValue)
      if (err) throw err
      items.value = items.value.filter((row) => row.id !== idValue)
    }

    /** Reset the loaded flag so the next `load()` refetches. */
    function invalidate() {
      loaded.value = false
    }

    return { items, loading, error, loaded, load, create, update, remove, invalidate }
  })
}

export { emptyToNull }
