/**
 * Shared display constants for Mezgab.
 */

/** A pleasant default swatch palette (used by colour picker fields). */
export const COLOR_SWATCHES = [
  '#0d9488',
  '#6366f1',
  '#f59e0b',
  '#ec4899',
  '#3b82f6',
  '#22c55e',
  '#ef4444',
  '#8b5cf6',
]

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export const TASK_STATUSES = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
]

/** Planning horizons a task can belong to. */
export const TASK_PLANS = [
  { value: 'daily', label: 'Daily', description: 'Today', color: '#3b82f6' },
  { value: 'weekly', label: 'Weekly', description: 'This week', color: '#8b5cf6' },
  { value: 'monthly', label: 'Monthly', description: 'This month', color: '#f59e0b' },
  { value: 'yearly', label: 'Yearly', description: 'This year', color: '#22c55e' },
]

export const TASK_RECURRENCES = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

const toMap = (list) => Object.fromEntries(list.map((item) => [item.value, item.label]))

export const PRIORITY_LABELS = toMap(TASK_PRIORITIES)
export const STATUS_LABELS = toMap(TASK_STATUSES)
export const PLAN_LABELS = toMap(TASK_PLANS)

/** Badge variant per priority. */
export const PRIORITY_BADGE = { low: 'success', medium: 'warning', high: 'destructive' }

/** Badge variant per plan horizon. */
export const PLAN_BADGE = {
  daily: 'info',
  weekly: 'purple',
  monthly: 'orange',
  yearly: 'success',
}

/**
 * Badge variant per display status. "overdue" is derived on the server, so
 * callers pass it explicitly rather than relying on the stored status.
 */
export const STATUS_BADGE = {
  not_started: 'muted',
  in_progress: 'cyan',
  completed: 'success',
  overdue: 'destructive',
}

export const STATUS_LABELS_ALL = { ...STATUS_LABELS, overdue: 'Overdue' }
