import { computed, ref } from 'vue'
import { format } from 'date-fns'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import { useToast } from '@/composables/useToast'

/**
 * App-wide task reminders.
 *
 * Every few minutes the dashboard summary is refreshed and the user is alerted
 * (browser notification + in-app toast) about overdue tasks and tasks due
 * within the next 24 hours. Each alert fires at most once per task per day;
 * fired keys are persisted so a reload doesn't re-alert.
 */

const STORAGE_KEY = 'worker-planner-reminders'
const CHECK_INTERVAL = 5 * 60 * 1000
const DUE_WINDOW = 24 * 60 * 60 * 1000

const supportsNotifications =
  typeof window !== 'undefined' && typeof window.Notification !== 'undefined'

const permission = ref(supportsNotifications ? window.Notification.permission : 'unsupported')
const overdue = ref([])
const upcoming = ref([])
const enabled = ref(supportsNotifications && window.Notification?.permission === 'granted')

let notified = loadNotified()
let timer = null

function loadNotified() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

function persistNotified() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...notified]))
  } catch {
    /* Storage may be unavailable — reminders still work in-memory. */
  }
}

function dayKey(prefix, id) {
  return `${prefix}:${id}:${format(new Date(), 'yyyy-MM-dd')}`
}

async function requestPermission() {
  if (!supportsNotifications) return 'unsupported'
  try {
    permission.value = await window.Notification.requestPermission()
  } catch {
    permission.value = 'denied'
  }
  enabled.value = permission.value === 'granted'
  return permission.value
}

function notify(title, body) {
  if (!supportsNotifications || window.Notification.permission !== 'granted') return
  try {
    new window.Notification(title, { body, icon: '/favicon.svg' })
  } catch {
    /* Ignore restricted contexts. */
  }
}

function alertOnce(key, title, body, tone) {
  if (notified.has(key)) return false
  notified.add(key)
  notify(title, body)
  const toast = useToast()
  toast[tone]?.(title, body)
  return true
}

function evaluate() {
  const soon = Date.now() + DUE_WINDOW

  for (const task of overdue.value) {
    alertOnce(
      dayKey('overdue', task.id),
      `Overdue: ${task.title}`,
      'This task is past its deadline.',
      'warning',
    )
  }

  for (const task of upcoming.value) {
    const due = task.deadline ? new Date(task.deadline).getTime() : Infinity
    if (due <= soon) {
      alertOnce(
        dayKey('due', task.id),
        `Due soon: ${task.title}`,
        'Deadline is within the next 24 hours.',
        'info',
      )
    }
  }

  persistNotified()
}

async function refresh() {
  const dashboard = useDashboardStore()
  const summary = await dashboard.load({ force: true })
  overdue.value = summary?.overdueTasks ?? []
  upcoming.value = summary?.upcoming ?? []
  evaluate()
}

async function start() {
  const auth = useAuthStore()
  if (!auth.isAuthenticated || timer) return
  await refresh().catch(() => {})
  timer = setInterval(() => refresh().catch(() => {}), CHECK_INTERVAL)
}

function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const overdueCount = computed(() => overdue.value.length)
const dueSoonCount = computed(
  () =>
    upcoming.value.filter((t) => {
      const due = t.deadline ? new Date(t.deadline).getTime() : Infinity
      return due <= Date.now() + DUE_WINDOW
    }).length,
)
const totalCount = computed(() => overdueCount.value + dueSoonCount.value)

export function useReminders() {
  return {
    supported: supportsNotifications,
    permission,
    enabled,
    overdue,
    upcoming,
    overdueCount,
    dueSoonCount,
    totalCount,
    requestPermission,
    refresh,
    start,
    stop,
  }
}
