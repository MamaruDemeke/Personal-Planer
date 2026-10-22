import { computed, ref } from 'vue'
import { format } from 'date-fns'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import { api } from '@/services/api'
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
const reminded = ref([])
const enabled = ref(supportsNotifications && window.Notification?.permission === 'granted')

let notified = loadNotified()
let timer = null
const reminderTimers = []

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

function playRing() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    // Two short beeps for a pleasant "ring".
    ;[0, 0.18].forEach((offset) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, now + offset)
      gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.16)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + offset)
      osc.stop(now + offset + 0.18)
    })
    setTimeout(() => ctx.close().catch(() => {}), 600)
  } catch {
    /* Audio may be blocked until user interaction �?" ignore. */
  }
}

function notify(title, body) {
  if (supportsNotifications && window.Notification.permission === 'granted') {
    try {
      new window.Notification(title, { body, icon: '/favicon.svg' })
    } catch {
      /* Ignore restricted contexts. */
    }
  }
  playRing()
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
  const now = Date.now()

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

  // Per-task reminders (ring at the chosen time).
  for (const task of reminded.value) {
    if (!task.reminderAt) continue
    const at = new Date(task.reminderAt).getTime()
    if (at <= now + 60 * 1000) {
      alertOnce(
        dayKey('reminder', task.id),
        `Reminder: ${task.title}`,
        'Your scheduled reminder is due.',
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
  try {
    const tasks = (await api.get('/tasks')) ?? []
    reminded.value = tasks.filter((t) => t.reminderAt)
  } catch {
    reminded.value = []
  }

  // Clear previously scheduled reminder timers.
  while (reminderTimers.length) {
    clearTimeout(reminderTimers.pop())
  }
  const now = Date.now()
  for (const task of reminded.value) {
    if (!task.reminderAt) continue
    const at = new Date(task.reminderAt).getTime()
    const delay = at - now
    if (delay > 0 && delay <= DUE_WINDOW) {
      const id = setTimeout(() => {
        alertOnce(
          dayKey('reminder', task.id),
          `Reminder: ${task.title}`,
          'Your scheduled reminder is due.',
          'info',
        )
        persistNotified()
      }, delay)
      reminderTimers.push(id)
    }
  }

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
const reminderCount = computed(
  () =>
    reminded.value.filter((t) => {
      if (!t.reminderAt) return false
      const at = new Date(t.reminderAt).getTime()
      return at <= Date.now() + DUE_WINDOW
    }).length,
)
const totalCount = computed(() => overdueCount.value + dueSoonCount.value + reminderCount.value)

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
