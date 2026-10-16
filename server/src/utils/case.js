/**
 * Key-case conversion between the database (snake_case) and the API contract
 * (camelCase). Only object keys are transformed; values are left untouched.
 */

const toCamelKey = (key) => key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())
const toSnakeKey = (key) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)

export function toCamel(value) {
  if (Array.isArray(value)) return value.map(toCamel)
  if (!value || typeof value !== 'object') return value
  const out = {}
  for (const [key, val] of Object.entries(value)) out[toCamelKey(key)] = val
  return out
}

export function toSnake(value) {
  if (Array.isArray(value)) return value.map(toSnake)
  if (!value || typeof value !== 'object') return value
  const out = {}
  for (const [key, val] of Object.entries(value)) out[toSnakeKey(key)] = val
  return out
}
