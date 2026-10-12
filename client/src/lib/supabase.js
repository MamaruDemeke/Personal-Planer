import { createClient } from '@supabase/supabase-js'

/**
 * Browser-side Supabase client.
 *
 * Only the publishable (anon) key is used here. It is safe to expose because
 * every table is protected by Row Level Security — see
 * `supabase/migrations/0002_row_level_security.sql`.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/**
 * True when real credentials are present. The placeholder values shipped in
 * `.env.example` are detected so the app can report that Supabase still needs
 * to be connected.
 */
export const isSupabaseConfigured = Boolean(
  url &&
    publishableKey &&
    !url.includes('your-project-ref') &&
    !publishableKey.includes('your-publishable'),
)

export const supabase = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
