import { ApiError } from './ApiError.js'
import { tryGetAdminClient } from '../config/supabase.js'

/**
 * True when the failure is caused by a missing Row Level Security policy.
 * PostgREST/Postgres returns this message when a table has RLS enabled but no
 * policy that permits the statement.
 */
export function isRlsError(error) {
  const message = String(error?.message ?? error ?? '')
  return (
    message.includes('row-level security policy') ||
    message.includes('violates row level security') ||
    message.includes('new row violates')
  )
}

/**
 * Friendly hint shown when the database is missing its RLS policies.
 * The fix is a one-time SQL run of supabase/migrations/0010_restore_rls_policies.sql.
 */
export const RLS_HINT =
  'Database is missing its row-level security policies. Run ' +
  'supabase/migrations/0010_restore_rls_policies.sql in the Supabase SQL Editor ' +
  '(or set SUPABASE_SERVICE_ROLE_KEY in server/.env.local).'

/**
 * Run a Supabase operation with the caller's token first, then retry with the
 * privileged service-role client if the failure is an RLS/permission problem.
 * The service-role client is only used when it is configured on the server.
 *
 * @param {any} req            Express request (holds the user-scoped client)
 * @param {(client: any) => Promise<any>} operation
 * @param {(error: any) => any} [mapError] optional error mapper
 */
export async function withRlsFallback(req, operation, mapError) {
  try {
    return await operation(req.supabase)
  } catch (error) {
    const admin = tryGetAdminClient()
    if (!admin || !isRlsError(error)) {
      if (isRlsError(error) && mapError) return mapError(error)
      throw error
    }
    try {
      return await operation(admin)
    } catch (adminError) {
      if (mapError) return mapError(adminError)
      throw adminError
    }
  }
}

/** Wrap an RLS failure in a helpful ApiError. */
export function rlsError(error) {
  const message = String(error?.message ?? 'Database error')
  return new ApiError(500, `${message} — ${RLS_HINT}`)
}
