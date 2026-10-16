import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

const isPlaceholder = (value) =>
  !value || value.includes('your-project-ref') || value.includes('your-publishable')

export const supabaseConfigured = !isPlaceholder(env.supabase.url) && !isPlaceholder(env.supabase.publishableKey)

/**
 * Shared client using the publishable (anon) key. Used to verify access tokens
 * with Supabase Auth. Never perform user queries with this client directly —
 * use `getUserClient(token)` so Row Level Security applies as that user.
 */
export const supabase = supabaseConfigured
  ? createClient(env.supabase.url, env.supabase.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null

/**
 * A Supabase client scoped to a specific user's access token. PostgREST will
 * execute queries as that user, so RLS policies are enforced.
 * @param {string} accessToken
 */
export function getUserClient(accessToken) {
  if (!supabaseConfigured) throw new Error('Supabase is not configured')
  return createClient(env.supabase.url, env.supabase.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}

/**
 * Privileged client using the service-role key. Server-only. Use sparingly and
 * only for operations that legitimately bypass RLS (admin/batch jobs).
 */
export function getAdminClient() {
  if (!env.supabase.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }
  return createClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Like `getAdminClient`, but returns null when no service-role key is set. */
export function tryGetAdminClient() {
  try {
    return getAdminClient()
  } catch {
    return null
  }
}
