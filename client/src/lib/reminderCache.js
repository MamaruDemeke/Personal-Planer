/**
 * Offline task/reminder cache.
 *
 * The reminder scheduler must keep working without a network connection, so
 * every successful `/tasks` response is mirrored into localStorage. When the
 * API is unreachable the cached copy is used and the "overdue"/"upcoming"
 * buckets are derived locally from the phone's clock.
 */

const TASKS_KEY = 'mezgab-tasks-cache'
const MAX_TASKS = 500
const WEEK = 7 * 24 * 60 * 60 * 1000

function pick(task) {
  return {
    id: task.id,
    title: task.title ?? '',
    status: task.status ?? 'not_started',
    priority: task.priority ?? 'medium',
    progress: task.progress ?? 0,
    deadline: task.deadline ?? null,
    reminderAt: task.reminderAt ?? null,
  }
}

export function saveTasks(tasks) {
  if (!Array.isArray(tasks)) return
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks.slice(0, MAX_TASKS).map(pick)))
  } catch {
    /* Storage may be unavailable - reminders still work for this session. */
  }
}

export function loadCachedTasks() {
  try {
    const raw = JSON.parse(localStorage.getItem(TASKS_KEY) ?? '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

/** Same rules the server uses, but evaluated against the local clock. */
export function deriveSummary(tasks, now = Date.now()) {
  const weekAhead = now + WEEK
  const isCompleted = (t) => t.status === 'completed'
  const deadlineMs = (t) => (t.deadline ? new Date(t.deadline).getTime() : null)

  const overdueTasks = tasks
    .filter((t) => !isCompleted(t) && deadlineMs(t) != null && deadlineMs(t) < now)
    .sort((a, b) => deadlineMs(a) - deadlineMs(b))

  const upcoming = tasks
    .filter((t) => {
      const at = deadlineMs(t)
      return !isCompleted(t) && at != null && at >= now && at <= weekAhead
    })
    .sort((a, b) => deadlineMs(a) - deadlineMs(b))

  return { overdueTasks, upcoming }
}
