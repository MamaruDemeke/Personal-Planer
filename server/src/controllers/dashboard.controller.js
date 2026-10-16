import { asyncHandler } from '../utils/asyncHandler.js'
import { toCamel } from '../utils/case.js'
import { unwrap } from '../utils/db.js'

/**
 * GET /api/dashboard/summary
 * Derives every dashboard statistic from the user's tasks (no stored counters).
 */
export const getSummary = asyncHandler(async (req, res) => {
  const rows = unwrap(await req.supabase.from('tasks').select('*')) ?? []
  const tasks = rows.map(toCamel)
  const now = Date.now()
  const weekAhead = now + 7 * 24 * 60 * 60 * 1000

  const isCompleted = (t) => t.status === 'completed'
  const isOverdue = (t) =>
    !isCompleted(t) && t.deadline != null && new Date(t.deadline).getTime() < now

  const total = tasks.length
  const completed = tasks.filter(isCompleted).length
  const overdue = tasks.filter(isOverdue).length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const notStarted = tasks.filter((t) => t.status === 'not_started').length
  const pending = total - completed
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100)

  const byPriority = { low: 0, medium: 0, high: 0 }
  for (const t of tasks) byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1

  const byStatus = { not_started: notStarted, in_progress: inProgress, completed }

  const upcoming = tasks
    .filter(
      (t) =>
        !isCompleted(t) &&
        t.deadline != null &&
        new Date(t.deadline).getTime() >= now &&
        new Date(t.deadline).getTime() <= weekAhead,
    )
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))

  const overdueTasks = tasks
    .filter(isOverdue)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))

  const avgProgress =
    total === 0 ? 0 : Math.round(tasks.reduce((sum, t) => sum + (t.progress ?? 0), 0) / total)

  res.json({
    data: {
      total,
      completed,
      pending,
      overdue,
      inProgress,
      notStarted,
      completionRate,
      avgProgress,
      byPriority,
      byStatus,
      upcoming,
      overdueTasks,
    },
  })
})
