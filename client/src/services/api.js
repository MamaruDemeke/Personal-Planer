import { supabase } from '@/lib/supabase'

/**
 * Thin REST client for the Express API.
 *
 * Every call attaches the current Supabase access token as a Bearer token; the
 * server verifies it and enforces Row Level Security on the user's behalf.
 * Successful responses are unwrapped from `{ data }`; errors are thrown as
 * `ApiError` with the server's message.
 */
const DEFAULT_API_BASE = import.meta.env.DEV ? 'http://localhost:4000/api' : '/api'
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE).replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

/**
 * Callback invoked whenever the server rejects a request because the account is
 * locked (unpaid / unapproved). Set once from App.vue to show a global notice.
 */
let lockedHandler = null
export function setLockedHandler(handler) {
  lockedHandler = handler
}

function buildQuery(query) {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

async function getToken() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function request(path, { method = 'GET', body, query } = {}) {
  const token = await getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE_URL}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Cannot reach the server. Make sure the API is running.', 0)
  }

  if (res.status === 204) return null

  let payload = null
  try {
    payload = await res.json()
  } catch {
    /* Empty or non-JSON body. */
  }

  if (!res.ok) {
    const details = payload?.error?.details
    const message = payload?.error?.message || `Request failed (${res.status})`
    if (res.status === 403 && typeof details?.code === 'string' && details.code.startsWith('ACCESS_')) {
      lockedHandler?.({ message, details })
    }
    throw new ApiError(message, res.status, details)
  }

  return payload?.data ?? null
}

export const api = {
  get: (path, query) => request(path, { method: 'GET', query }),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  baseUrl: BASE_URL,
}
