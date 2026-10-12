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

/** Human-friendly due label: Today, Tomorrow, Yesterday or a date. */
export function formatDue(value) {
  if (!value) return 'No due date'
  const date = new Date(value)
  if (isToday(date)) return `Today · ${format(date, 'h:mm a')}`
  if (isTomorrow(date)) return `Tomorrow · ${format(date, 'h:mm a')}`
  if (isYesterday(date)) return `Yesterday · ${format(date, 'h:mm a')}`
  return format(date, 'MMM d · h:mm a')
}

/** @param {string|Date} value */
export function formatRelative(value) {
  if (!value) return ''
  return formatDistanceToNow(new Date(value), { addSuffix: true })
}
