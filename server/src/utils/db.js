import { ApiError } from './ApiError.js'

/**
 * Unwrap a Supabase PostgREST response, throwing an ApiError on failure.
 * @param {{ data: any, error: any, count?: number }} result
 */
export function unwrap(result) {
  if (result?.error) {
    const { code, message, status } = result.error
    const statusCode = code === 'PGRST116' ? 404 : status && status >= 400 ? status : 400
    throw new ApiError(statusCode, message || 'Database error')
  }
  return result?.data
}
