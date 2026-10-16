import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns'

/** @param {string|Date} value */
export function formatTime(value) {
  if (!value) return ''
  return format(new Date(value), 'h:mm a')
}

/** @param {string|Date} value */
export function formatDate(value, pattern = 'MMM d, yyyy') {
  if (!value) return ''
  return format(new Date(value), pattern)
}

/** Short date + time, e.g. "Jun 5, 3:30 PM". */
export function formatDateTime(value) {
  if (!value) return ''
  return format(new Date(value), 'MMM d, h:mm a')
}

/** Human-friendly label: Today, Tomorrow, Yesterday or a date. */
export function formatDue(value) {
  if (!value) return 'No due date'
  const date = new Date(value)
  if (isToday(date)) return `Today · ${format(date, 'h:mm a')}`
  if (isTomorrow(date)) return `Tomorrow · ${format(date, 'h:mm a')}`
  if (isYesterday(date)) return `Yesterday · ${format(date, 'h:mm a')}`
  return format(date, 'MMM d · h:mm a')
}

/** Compact start → end range for a task. */
export function formatRange(start, end) {
  if (!start && !end) return 'No dates set'
  if (start && !end) return `From ${formatDate(start)}`
  if (!start && end) return `Until ${formatDate(end)}`
  return `${formatDate(start, 'MMM d')} → ${formatDate(end)}`
}

/** @param {string|Date} value */
export function formatRelative(value) {
  if (!value) return ''
  return formatDistanceToNow(new Date(value), { addSuffix: true })
}

/** Human-friendly duration from a millisecond span, e.g. "3h 20m" or "2d 4h". */
export function formatDuration(ms) {
  if (ms == null || Number.isNaN(ms)) return '—'
  const minutes = Math.max(0, Math.round(ms / 60000))
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remMinutes = minutes % 60
  if (hours < 24) return remMinutes ? `${hours}h ${remMinutes}m` : `${hours}h`
  const days = Math.floor(hours / 24)
  const remHours = hours % 24
  return remHours ? `${days}d ${remHours}h` : `${days}d`
}
