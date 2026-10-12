import 'dotenv/config'

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
