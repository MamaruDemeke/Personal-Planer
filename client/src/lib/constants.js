/**
 * Shared domain constants and display metadata.
 * Enum values mirror the PostgreSQL enums in supabase/migrations/0001_init_schema.sql.
 */

export const PRIORITIES = ['low', 'medium', 'high', 'urgent']
export const TASK_STATUSES = ['todo', 'in_progress', 'completed']
export const PROJECT_STATUSES = ['active', 'paused', 'completed', 'archived']
export const GOAL_STATUSES = ['active', 'completed', 'archived']
export const REMINDER_CHANNELS = ['in_app', 'email', 'push']
export const REMINDER_STATUSES = ['pending', 'sent', 'failed', 'cancelled']
export const PLAN_PERIODS = ['daily', 'weekly', 'monthly', 'yearly']
export const PLAN_STATUSES = ['active', 'completed', 'archived']

export const priorityMeta = {
  low: { label: 'Low', variant: 'secondary' },
  medium: { label: 'Medium', variant: 'default' },
  high: { label: 'High', variant: 'warning' },
  urgent: { label: 'Urgent', variant: 'destructive' },
}

export const statusMeta = {
  todo: { label: 'To Do', variant: 'outline' },
  in_progress: { label: 'In Progress', variant: 'default' },
  completed: { label: 'Completed', variant: 'success' },
}

export const projectStatusMeta = {
  active: { label: 'Active', variant: 'info' },
  paused: { label: 'Paused', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  archived: { label: 'Archived', variant: 'muted' },
}

export const goalStatusMeta = {
  active: { label: 'Active', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  archived: { label: 'Archived', variant: 'muted' },
}

export const reminderChannelMeta = {
  in_app: { label: 'In-app' },
  email: { label: 'Email' },
  push: { label: 'Push' },
}

export const reminderStatusMeta = {
  pending: { label: 'Pending', variant: 'warning' },
  sent: { label: 'Sent', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'muted' },
}

/** Plan cadence metadata. `accent` colors the period chip and progress bar. */
export const planPeriodMeta = {
  daily: { label: 'Daily', variant: 'info', accent: '#0ea5e9', days: 1 },
  weekly: { label: 'Weekly', variant: 'default', accent: '#8b5cf6', days: 7 },
  monthly: { label: 'Monthly', variant: 'warning', accent: '#f59e0b', days: 30 },
  yearly: { label: 'Yearly', variant: 'secondary', accent: '#ec4899', days: 365 },
}

/** Plan lifecycle metadata. `overdue` is derived by the UI, not stored. */
export const planStatusMeta = {
  active: { label: 'Active', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  overdue: { label: 'Overdue', variant: 'destructive' },
  archived: { label: 'Archived', variant: 'muted' },
}

/** A pleasant default swatch palette for categories. */
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
