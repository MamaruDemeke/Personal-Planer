import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { useAccessStore } from '@/stores/access'
import { useNotificationsStore } from '@/stores/notifications'

/**
 * Authentication store backed by Supabase Auth.
 *
 * When Supabase is not configured `isConfigured` is false and the store stays
 * in a safe unauthenticated state.
 */
export const useAuthStore = defineStore('auth', () => {  const session = ref(null)
  const user = ref(null)
  const profile = ref(null)
  const loading = ref(false)
  const initialized = ref(false)
  const error = ref(null)

  const isConfigured = isSupabaseConfigured
  const isAuthenticated = computed(() => Boolean(session.value && user.value))

  /** Clear session-scoped stores whenever the signed-in user changes. */
  function resetSessionStores() {
    useAccessStore().invalidate()
    useNotificationsStore().reset()
  }
  const displayName = computed(
    () => profile.value?.full_name || user.value?.user_metadata?.full_name || user.value?.email || 'Guest',
  )
  const initials = computed(() => {
    const source = displayName.value.trim()
    if (!source) return '?'
    const parts = source.split(/\s+/)
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
  })

  async function initialize() {
    if (initialized.value) return
    if (!isConfigured || !supabase) {
      initialized.value = true
      return
    }
    try {
      const { data } = await supabase.auth.getSession()
      session.value = data.session ?? null
      user.value = data.session?.user ?? null
      if (user.value) await fetchProfile()
      resetSessionStores()
      supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        const previousId = user.value?.id ?? null
        session.value = nextSession ?? null
        user.value = nextSession?.user ?? null
        if (user.value?.id !== previousId) resetSessionStores()
        if (user.value) {
          await fetchProfile()
        } else {
          profile.value = null
        }
      })
    } catch (err) {
      error.value = err?.message ?? 'Failed to restore session'
    } finally {
      initialized.value = true
    }
  }

  async function signIn(email, password) {
    if (!isConfigured || !supabase) throw new Error('Supabase is not configured')
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
      session.value = data.session
      user.value = data.user
      resetSessionStores()
      await fetchProfile()
      return data
    } catch (err) {
      error.value = err?.message ?? 'Sign in failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function signUp(email, password, fullName) {
    if (!isConfigured || !supabase) throw new Error('Supabase is not configured')
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/`,
        },
      })
      if (err) throw err
      session.value = data.session
      user.value = data.user
      resetSessionStores()
      return data
    } catch (err) {
      error.value = err?.message ?? 'Sign up failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    if (!isConfigured || !supabase) return
    await supabase.auth.signOut()
    session.value = null
    user.value = null
    profile.value = null
    resetSessionStores()
  }

  async function sendPasswordReset(email) {
    if (!isConfigured || !supabase) throw new Error('Supabase is not configured')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (err) throw err
  }

  async function updatePassword(newPassword) {
    if (!isConfigured || !supabase) throw new Error('Supabase is not configured')
    const { error: err } = await supabase.auth.updateUser({ password: newPassword })
    if (err) throw err
  }

  async function fetchProfile() {
    if (!isConfigured || !supabase || !user.value) return
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .maybeSingle()
    if (!err) profile.value = data
  }

  async function updateProfile(patch) {
    if (!isConfigured || !supabase || !user.value) throw new Error('Not authenticated')
    const { data, error: err } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', user.value.id)
      .select()
      .single()
    if (err) throw err
    profile.value = data
    return data
  }

  return {
    session,
    user,
    profile,
    loading,
    initialized,
    error,
    isConfigured,
    isAuthenticated,
    displayName,
    initials,
    initialize,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    updatePassword,
    fetchProfile,
    updateProfile,
  }
})
