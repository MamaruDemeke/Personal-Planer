import { ref } from 'vue'
import { defineStore } from 'pinia'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { toCamel, toSnake, emptyToNull } from '@/lib/case'

/**
 * Factory that builds a Pinia store exposing full CRUD for one Supabase table.
 *
 * Two modes:
 *  - **Connected** (Supabase configured): reads/writes the real table. Row
 *    Level Security restricts every row to the signed-in user; `user_id` is set
 *    from the verified session — never from user input.
 *  - **Demo** (no Supabase): operates on an in-memory copy of the seed data so
 *    the whole UI is usable before credentials are added.
 *
 * @param {string} id        Pinia store id, e.g. 'tasks'
 * @param {object} options
 * @param {string} options.table   Supabase table name
 * @param {() => object[]} options.seed  Function returning demo rows
 * @param {string} [options.order] Column to order by (default created_at desc)
 * @param {(payload: object) => object} [options.beforeCreate]  Map app model → DB columns
 */
export function createResourceStore(id, options) {
  const { table, seed = () => [], order = 'created_at', beforeCreate } = options

  return defineStore(id, () => {
    const items = ref([])
    const loading = ref(false)
    const error = ref(null)
    const loaded = ref(false)
    const isDemo = !isSupabaseConfigured

    async function load(force = false) {
      if (loaded.value && !force) return
      loading.value = true
      error.value = null
      try {
        if (isDemo) {
          items.value = seed().map((row) => ({ ...row }))
        } else {
          const { data, error: err } = await supabase
            .from(table)
            .select('*')
            .order(order, { ascending: false })
          if (err) throw err
          items.value = data.map(toCamel)
        }
        loaded.value = true
      } catch (err) {
        error.value = err?.message ?? `Failed to load ${table}`
      } finally {
        loading.value = false
      }
    }

    async function create(payload) {
      const prepared = beforeCreate ? beforeCreate(payload) : payload
      if (isDemo) {
        const now = new Date().toISOString()
        const row = {
          id: crypto.randomUUID(),
          ...prepared,
          createdAt: now,
          updatedAt: now,
        }
        items.value = [row, ...items.value]
        return row
      }
      const { data: userData, error: userErr } = await supabase.auth.getUser()
      if (userErr || !userData?.user) throw new Error('You must be signed in.')
      const body = toSnake({ ...prepared, user_id: userData.user.id })
      const { data, error: err } = await supabase.from(table).insert(body).select().single()
      if (err) throw err
      const row = toCamel(data)
      items.value = [row, ...items.value]
      return row
    }

    async function update(idValue, payload) {
      const prepared = beforeCreate ? beforeCreate(payload, true) : payload
      if (isDemo) {
        let updated = null
        items.value = items.value.map((row) => {
          if (row.id !== idValue) return row
          updated = { ...row, ...prepared, updatedAt: new Date().toISOString() }
          return updated
        })
        return updated
      }
      const { data, error: err } = await supabase
        .from(table)
        .update(toSnake(prepared))
        .eq('id', idValue)
        .select()
        .single()
      if (err) throw err
      const row = toCamel(data)
      items.value = items.value.map((item) => (item.id === idValue ? row : item))
      return row
    }

    async function remove(idValue) {
      if (isDemo) {
        items.value = items.value.filter((row) => row.id !== idValue)
        return
      }
      const { error: err } = await supabase.from(table).delete().eq('id', idValue)
      if (err) throw err
      items.value = items.value.filter((row) => row.id !== idValue)
    }

    /** Reset the loaded flag so the next `load()` refetches. */
    function invalidate() {
      loaded.value = false
    }

    return { items, loading, error, loaded, isDemo, load, create, update, remove, invalidate }
  })
}

export { emptyToNull }
