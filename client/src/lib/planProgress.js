import { differenceInCalendarDays } from 'date-fns'

/**
 * Pure progress-tracking helpers for plans.
 *
 * A plan's progress is always DERIVED from its linked tasks — nothing is
 * stored on the plan while it is in flight. The one exception is a completed
 * plan, which displays the `finalProgress` snapshot the database captured at
 * the moment of completion (so history never changes when tasks are edited).
 */

/** Tasks that belong to a plan. */
export function planTasks(tasks, planId) {
  if (!planId) return []
  return (tasks ?? []).filter((t) => t.planId === planId)
}

/**
 * Compute the live progress of a single plan.
 *
 * @param {object} plan     camelCase plan record
 * @param {Array}  tasks    all tasks (any plan)
 * @param {Date}   [now]    reference time (injectable for tests)
 */
export function computePlanProgress(plan, tasks, now = new Date()) {
  const list = planTasks(tasks, plan?.id)
  const total = list.length
  const completed = list.filter((t) => t.status === 'completed').length
  const remaining = total - completed
  const livePercent = total > 0 ? Math.round((completed / total) * 100) : 0

  const isCompleted = plan?.status === 'completed'
  const isArchived = plan?.status === 'archived'
  const usingFinal = isCompleted && plan?.finalProgress !== null && plan?.finalProgress !== undefined
  const percent = usingFinal ? clampPercent(plan.finalProgress) : livePercent

  const deadline = plan?.deadline ? new Date(plan.deadline) : null
  const validDeadline = deadline && !Number.isNaN(deadline.getTime()) ? deadline : null
  const isOverdue = !isCompleted && !isArchived && !!validDeadline && validDeadline.getTime() < now.getTime()
  const daysRemaining = validDeadline ? differenceInCalendarDays(validDeadline, now) : null

  return {
    planId: plan?.id ?? null,
    total,
    completed,
    remaining,
    percent,
    livePercent,
    isCompleted,
    isArchived,
    isOverdue,
    deadline: validDeadline,
    daysRemaining,
    usingFinal,
    tasks: list,
  }
}

function clampPercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, Math.round(n)))
}

/** The single status to badge a plan with, folding in the derived overdue state. */
export function derivedPlanStatus(plan, progress) {
  if (progress?.isCompleted || plan?.status === 'completed') return 'completed'
  if (progress?.isArchived || plan?.status === 'archived') return 'archived'
  if (progress?.isOverdue) return 'overdue'
  return 'active'
}

/**
 * Human-readable deadline state, e.g. "3 days left", "Overdue by 2 days",
 * "Completed Jul 4, 2026" or "No deadline".
 */
export function deadlineLabel(progress, plan, formatDate) {
  const fmt = formatDate ?? ((d) => new Date(d).toLocaleDateString())
  if (progress?.isCompleted) {
    return plan?.completedAt ? `Completed ${fmt(plan.completedAt)}` : 'Completed'
  }
  if (!progress?.deadline) return 'No deadline'
  const days = progress.daysRemaining
  if (progress.isOverdue) {
    const late = Math.abs(days ?? 0)
    return `Overdue by ${late} ${late === 1 ? 'day' : 'days'}`
  }
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days > 1) return `${days} days left`
  return fmt(progress.deadline)
}

/**
 * Aggregate summary across many plans — used by the dashboard and reports.
 * @returns {{total:number,active:number,completed:number,overdue:number,archived:number,avgProgress:number}}
 */
export function summarizePlans(plans, tasks, now = new Date()) {
  const rows = (plans ?? []).map((p) => computePlanProgress(p, tasks, now))
  const active = rows.filter((r) => !r.isCompleted && !r.isArchived)
  const completed = rows.filter((r) => r.isCompleted)
  const overdue = rows.filter((r) => r.isOverdue)
  const archived = rows.filter((r) => r.isArchived)
  const avgProgress = active.length
    ? Math.round(active.reduce((sum, r) => sum + r.percent, 0) / active.length)
    : 0
  return {
    total: rows.length,
    active: active.length,
    completed: completed.length,
    overdue: overdue.length,
    archived: archived.length,
    avgProgress,
  }
}
