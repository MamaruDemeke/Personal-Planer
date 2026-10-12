import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge conditional class names with Tailwind conflict resolution.
 * @param {...any} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as a compact percentage string.
 * Guards against division by zero and non-finite inputs.
 * @param {number} value
 * @param {number} total
 * @returns {string} e.g. "72%"
 */
export function percentage(value, total) {
  const t = Number(total)
  const v = Number(value)
  if (!t || t <= 0 || !Number.isFinite(t)) return '0%'
  const pct = Math.round((v / t) * 100)
  if (!Number.isFinite(pct) || isNaN(pct)) return '0%'
  return `${Math.min(100, Math.max(0, pct))}%`
}
