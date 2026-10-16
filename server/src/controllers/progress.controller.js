import { asyncHandler } from '../utils/asyncHandler.js'
import { toCamel } from '../utils/case.js'
import { unwrap } from '../utils/db.js'

const DAY_MS = 24 * 60 * 60 * 1000

function isoDay(date) {
  return new Date(date).toISOString().slice(0, 10)
}

function startOfWeek(date) {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  const shift = (d.getUTCDay() + 6) % 7 // Monday = 0
  d.setUTCDate(d.getUTCDate() - shift)
  return d
}

function bucketKey(period, timestamp) {
  const d = new Date(timestamp)
  return period === 'weekly' ? isoDay(startOfWeek(d)) : isoDay(d)
}

/**
 * GET /api/progress?period=daily|weekly&range=N
 * Task completion percentages, real completion times, delayed tasks and
 * per-period rollups, all derived from the user's tasks.
 */
export const getProgress = asyncHandler(async (req, res) => {
  const period = req.query.period === 'weekly' ? 'weekly' : 'daily'
  const requested = Number.parseInt(req.query.range, 10)
  const fallback = period === 'weekly' ? 8 : 14
  const range = Math.min(Math.max(Number.isFinite(requested) ? requested : fallback, 1), 60)

  const [taskRows, categoryRows] = await Promise.all([
    unwrap(await req.supabase.from('tasks').select('*')),
    unwrap(await req.supabase.from('categories').select('id, name, color')),
  ])

  const tasks = (taskRows ?? []).map(toCamel)
  const categories = (categoryRows ?? []).map(toCamel)
  const now = Date.now()

  const isCompleted = (t) => t.status === 'completed'
  const isOverdue = (t) => !isCompleted(t) && t.deadline != null && new Date(t.deadline).getTime() < now

  const total = tasks.length
  const completed = tasks.filter(isCompleted).length
  const overdue = tasks.filter(isOverdue).length
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100)
  const avgProgress =
    total === 0 ? 0 : Math.round(tasks.reduce((sum, t) => sum + (t.progress ?? 0), 0) / total)

  // Actual completion times for finished tasks.
  const completionTimes = tasks
    .filter((t) => isCompleted(t) && t.completedAt)
    .map((t) => {
      const startedAt = t.startDate ?? t.createdAt
      const startMs = startedAt ? new Date(startedAt).getTime() : null
      const endMs = new Date(t.completedAt).getTime()
      const deadlineMs = t.deadline ? new Date(t.deadline).getTime() : null
      return {
        id: t.id,
        title: t.title,
        priority: t.priority,
        categoryId: t.categoryId,
        startedAt,
        deadline: t.deadline,
        completedAt: t.completedAt,
        durationMs: startMs != null ? Math.max(0, endMs - startMs) : null,
        latenessMs: deadlineMs != null ? endMs - deadlineMs : null,
        onTime: deadlineMs == null ? null : endMs <= deadlineMs,
        completedLate: Boolean(t.completedLate),
      }
    })
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))

  const measured = completionTimes.filter((c) => c.durationMs != null)
  const avgCompletionMs = measured.length
    ? Math.round(measured.reduce((sum, c) => sum + c.durationMs, 0) / measured.length)
    : null

  const withDeadline = completionTimes.filter((c) => c.onTime != null)
  const onTimeRate = withDeadline.length
    ? Math.round((withDeadline.filter((c) => c.onTime).length / withDeadline.length) * 100)
    : null

  // Delayed tasks: still overdue, or finished after their deadline.
  const delayedTasks = tasks
    .filter((t) => (isCompleted(t) ? t.completedLate && t.deadline : isOverdue(t)))
    .map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      deadline: t.deadline,
      completedAt: t.completedAt,
      completedLate: Boolean(t.completedLate),
      overdue: isOverdue(t),
    }))
    .sort((a, b) => new Date(b.deadline ?? 0) - new Date(a.deadline ?? 0))

  // Per-period rollups: completed / delayed / added.
  const buckets = []
  const bucketsMap = new Map()
  const anchor = period === 'weekly' ? startOfWeek(now).getTime() : new Date(isoDay(now)).getTime()
  const step = period === 'weekly' ? 7 * DAY_MS : DAY_MS
  for (let i = range - 1; i >= 0; i -= 1) {
    const key = isoDay(anchor - i * step)
    const bucket = { key, completed: 0, delayed: 0, added: 0 }
    buckets.push(bucket)
    bucketsMap.set(key, bucket)
  }

  const bump = (timestamp, field) => {
    if (timestamp == null) return
    const bucket = bucketsMap.get(bucketKey(period, timestamp))
    if (bucket) bucket[field] += 1
  }

  for (const t of tasks) {
    bump(t.createdAt, 'added')
    if (isCompleted(t) && t.completedAt) {
      bump(t.completedAt, 'completed')
      if (t.completedLate) bump(t.completedAt, 'delayed')
    } else if (isOverdue(t)) {
      bump(t.deadline, 'delayed')
    }
  }

  // Completion percentage per category.
  const byCategory = categories
    .map((c) => {
      const list = tasks.filter((t) => t.categoryId === c.id)
      const done = list.filter(isCompleted).length
      return {
        id: c.id,
        name: c.name,
        color: c.color,
        total: list.length,
        completed: done,
        rate: list.length ? Math.round((done / list.length) * 100) : 0,
      }
    })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)

  const uncategorized = tasks.filter((t) => !t.categoryId)
  if (uncategorized.length) {
    const done = uncategorized.filter(isCompleted).length
    byCategory.push({
      id: null,
      name: 'Uncategorized',
      color: '#94a3b8',
      total: uncategorized.length,
      completed: done,
      rate: Math.round((done / uncategorized.length) * 100),
    })
  }

  res.json({
    data: {
      period,
      range,
      total,
      completed,
      overdue,
      completionRate,
      avgProgress,
      avgCompletionMs,
      onTimeRate,
      completionTimes: completionTimes.slice(0, 50),
      delayedTasks: delayedTasks.slice(0, 50),
      delayedCount: delayedTasks.length,
      buckets,
      byCategory,
    },
  })
})
