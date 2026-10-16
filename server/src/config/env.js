import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// `.env` holds non-secret defaults (tracked in git).
dotenv.config({ path: path.join(serverRoot, '.env') })
// `.env.local` overrides them and is git-ignored - put secrets (e.g.
// SUPABASE_SERVICE_ROLE_KEY) here so they are never committed.
dotenv.config({ path: path.join(serverRoot, '.env.local'), override: true })
dotenv.config()

function required(name, fallback) {
  const value = process.env[name] ?? fallback
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  /**
   * Accounts with these email addresses are treated as administrators and are
   * promoted automatically (requires the service-role key). Comma-separated.
   */
  adminEmails: (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  supabase: {
    url: process.env.SUPABASE_URL ?? '',
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  },
}

export const isProduction = env.nodeEnv === 'production'

/** Assert that Supabase configuration is present (used once auth is wired up). */
export function assertSupabaseConfigured() {
  const { url, publishableKey } = env.supabase
  const placeholder =
    !url ||
    !publishableKey ||
    url.includes('your-project-ref') ||
    publishableKey.includes('your-publishable')
  if (placeholder) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in server/.env.',
    )
  }
}

export { required }
