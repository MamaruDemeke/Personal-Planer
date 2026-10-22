<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  getDate,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Filter,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PlanTaskItem from '@/components/plan/PlanTaskItem.vue'
import ResourceFormDialog from '@/components/forms/ResourceFormDialog.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Select from '@/components/ui/Select.vue'
import { Progress } from '@/components/ui/progress'
import { useTasksStore } from '@/stores/tasks'
import { useCategoriesStore } from '@/stores/categories'
import { useDashboardStore } from '@/stores/dashboard'
import { useToast } from '@/composables/useToast'
import { useAccessGate } from '@/composables/useAccessGate'
import { taskSchema } from '@/schemas'
import { TASK_PLANS, TASK_PRIORITIES, TASK_STATUSES, TASK_RECURRENCES } from '@/lib/constants'

const route = useRoute()
const router = useRouter()
const tasks = useTasksStore()
const categories = useCategoriesStore()
const dashboard = useDashboardStore()
const toast = useToast()
const { ensureWrite } = useAccessGate()

const PERIOD_LABELS = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }
const PERIOD_DESCRIPTIONS = {
  daily: 'Plan and track today’s work.',
  weekly: 'Balance the week ahead.',
  monthly: 'See the whole month at a glance.',
  yearly: 'Set the year’s direction.',
}

function resolveAnchor() {
  const d = route.query.date
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(`${d}T12:00:00`)
  return new Date()
}

const anchor = ref(resolveAnchor())
const period = computed(() => route.meta.period || 'daily')

watch(
  () => route.query.date,
  () => {
    anchor.value = resolveAnchor()
  },
)

onMounted(() => {
  categories.load().catch(() => {})
  tasks.load({}, { force: true }).catch(() => {})
})

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------
const search = ref('')
const statusFilter = ref('')
const priorityFilter = ref('')
const categoryFilter = ref('')

const categoryOptions = computed(() =>
  categories.items.map((c) => ({ value: c.id, label: c.name })),
)

// ---------------------------------------------------------------------------
// Range + derived task lists
// ---------------------------------------------------------------------------
const range = computed(() => {
  const a = anchor.value
  if (period.value === 'weekly') {
    return { start: startOfWeek(a, { weekStartsOn: 1 }), end: endOfWeek(a, { weekStartsOn: 1 }) }
  }
  if (period.value === 'monthly') return { start: startOfMonth(a), end: endOfMonth(a) }
  if (period.value === 'yearly') return { start: startOfYear(a), end: endOfYear(a) }
  return { start: startOfDay(a), end: endOfDay(a) }
})

const heading = computed(() => `${PERIOD_LABELS[period.value]} Plan`)
const label = computed(() => {
  const { start, end } = range.value
  if (period.value === 'weekly') return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
  if (period.value === 'monthly') return format(start, 'MMMM yyyy')
  if (period.value === 'yearly') return format(start, 'yyyy')
  return format(start, 'EEEE, MMM d, yyyy')
})

const all = computed(() => tasks.items)

const categoryById = computed(() =>
  Object.fromEntries(categories.items.map((c) => [c.id, c])),
)

function matchesPlan(t) {
  return (t.plan ?? 'daily') === period.value
}

function taskStart(t) {
  return t.startDate ? new Date(t.startDate) : t.deadline ? new Date(t.deadline) : null
}
function taskEnd(t) {
  return t.deadline ? new Date(t.deadline) : t.startDate ? new Date(t.startDate) : null
}
function overlaps(t, s, e) {
  const a = taskStart(t)
  const b = taskEnd(t)
  if (!a || !b) return false
  return a <= e && b >= s
}
const byDeadline = (a, b) =>
  (a.deadline ? new Date(a.deadline) : Infinity) - (b.deadline ? new Date(b.deadline) : Infinity)

function applyFilters(list) {
  const term = search.value.trim().toLowerCase()
  return list.filter((t) => {
    if (term && !String(t.title ?? '').toLowerCase().includes(term) && !String(t.description ?? '').toLowerCase().includes(term)) {
      return false
    }
    if (statusFilter.value && t.status !== statusFilter.value) return false
    if (priorityFilter.value && t.priority !== priorityFilter.value) return false
    if (categoryFilter.value && t.categoryId !== categoryFilter.value) return false
    return true
  })
}

const periodTasks = computed(() =>
  all.value
    .filter((t) => matchesPlan(t) && overlaps(t, range.value.start, range.value.end))
    .sort(byDeadline),
)
const filteredPeriodTasks = computed(() => applyFilters(periodTasks.value))

const unscheduled = computed(() =>
  all.value.filter((t) => matchesPlan(t) && !t.startDate && !t.deadline),
)
const filteredUnscheduled = computed(() => applyFilters(unscheduled.value))

const stats = computed(() => {
  const list = periodTasks.value
  return {
    total: list.length,
    completed: list.filter((t) => t.isCompleted).length,
    inProgress: list.filter((t) => t.status === 'in_progress').length,
    pending: list.filter((t) => t.status === 'not_started').length,
    overdue: list.filter((t) => t.overdue).length,
  }
})
const completionRate = computed(() =>
  stats.value.total === 0 ? 0 : Math.round((stats.value.completed / stats.value.total) * 100),
)

const weekDays = computed(() =>
  period.value === 'weekly' ? eachDayOfInterval(range.value) : [],
)

function tasksForDay(day) {
  const s = startOfDay(day)
  const e = endOfDay(day)
  return all.value.filter((t) => matchesPlan(t) && overlaps(t, s, e)).sort(byDeadline)
}

const monthWeeks = computed(() => {
  if (period.value !== 'monthly') return []
  const s = startOfWeek(range.value.start, { weekStartsOn: 1 })
  const e = endOfWeek(range.value.end, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: s, end: e })
  const weeks = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return weeks
})

const monthNames = computed(() => {
  if (period.value !== 'yearly') return []
  const y = range.value.start.getFullYear()
  return Array.from({ length: 12 }, (_, m) => {
    const ms = new Date(y, m, 1)
    const list = all.value.filter((t) => matchesPlan(t) && overlaps(t, ms, endOfMonth(ms)))
    return {
      date: ms,
      label: format(ms, 'MMM'),
      count: list.length,
      completed: list.filter((t) => t.isCompleted).length,
    }
  })
})

const today = new Date()

function shift(direction) {
  const a = anchor.value
  if (period.value === 'weekly') anchor.value = addWeeks(a, direction)
  else if (period.value === 'monthly') anchor.value = addMonths(a, direction)
  else if (period.value === 'yearly') anchor.value = addYears(a, direction)
  else anchor.value = addDays(a, direction)
}

function goToday() {
  anchor.value = new Date()
}

function openDay(day) {
  router.push({ name: 'plan-daily', query: { date: format(day, 'yyyy-MM-dd') } })
}

function openMonth(date) {
  router.push({ name: 'plan-monthly', query: { date: format(date, 'yyyy-MM-dd') } })
}

async function toggleComplete(task) {
  if (!ensureWrite()) return
  const progress = (task.progress ?? 0) >= 100 ? 0 : 100
  try {
    await tasks.update(task.id, { progress })
    dashboard.invalidate()
    toast.success(progress >= 100 ? 'Task marked complete' : 'Task reopened')
  } catch (err) {
    toast.error('Could not update task', err?.message)
  }
}

// ---------------------------------------------------------------------------
// Quick create
// ---------------------------------------------------------------------------
const dialogOpen = ref(false)
const editing = ref(null)

const fields = computed(() => [
  { name: 'title', label: 'Title', type: 'text', required: true, span: 2, placeholder: 'e.g. Pour the foundation' },
  {
    name: 'plan',
    label: 'Plan',
    type: 'segmented',
    required: true,
    default: period.value,
    span: 2,
    help: 'Which planning horizon does this task belong to?',
    options: TASK_PLANS.map((p) => ({ ...p, icon: null })),
  },
  { name: 'description', label: 'Description', type: 'richtext', span: 2, placeholder: 'What needs to be done?' },
  { name: 'workNotes', label: 'Work notes', type: 'richtext', span: 2, placeholder: 'Notes on the work done...' },
  { name: 'reminderAt', label: 'Reminder', type: 'datetime' },
  { name: 'categoryId', label: 'Category', type: 'select', options: categoryOptions.value },
  { name: 'priority', label: 'Priority', type: 'select', required: true, default: 'medium', options: TASK_PRIORITIES },
  { name: 'status', label: 'Status', type: 'select', default: 'not_started', options: TASK_STATUSES },
  { name: 'startDate', label: 'Start date', type: 'datetime' },
  { name: 'deadline', label: 'Deadline', type: 'datetime' },
  { name: 'progress', label: 'Progress (%)', type: 'number', min: 0, max: 100, placeholder: '0' },
])

const createInitial = ref(null)

function openCreate(prefillDate = null) {
  if (!ensureWrite()) return
  editing.value = null
  const base = prefillDate ? startOfDay(prefillDate) : anchor.value
  createInitial.value = {
    plan: period.value,
    startDate: base.toISOString(),
  }
  dialogOpen.value = true
}

function openEdit(task) {
  if (!ensureWrite()) return
  editing.value = task
  createInitial.value = null
  dialogOpen.value = true
}

async function submit(values) {
  if (!ensureWrite()) return
  try {
    if (editing.value) {
      await tasks.update(editing.value.id, values)
      toast.success('Task updated')
    } else {
      await tasks.create(values)
      toast.success('Task created')
    }
    dashboard.invalidate()
  } catch (err) {
    toast.error('Could not save task', err?.message)
    throw err
  }
}

// ---------------------------------------------------------------------------
// Rollover unfinished tasks into the next period
// ---------------------------------------------------------------------------
const rolling = ref(false)
async function rollover() {
  if (!ensureWrite()) return
  const candidates = periodTasks.value.filter((t) => !t.isCompleted)
  if (!candidates.length) {
    toast.info('No unfinished tasks to roll over')
    return
  }
  rolling.value = true
  let count = 0
  try {
    for (const t of candidates) {
      const patch = {}
      if (t.startDate) {
        const d = new Date(t.startDate)
        patch.startDate =
          period.value === 'daily'
            ? addDays(d, 1).toISOString()
            : period.value === 'weekly'
              ? addWeeks(d, 1).toISOString()
              : period.value === 'monthly'
                ? addMonths(d, 1).toISOString()
                : addYears(d, 1).toISOString()
      }
      if (t.deadline) {
        const d = new Date(t.deadline)
        patch.deadline =
          period.value === 'daily'
            ? addDays(d, 1).toISOString()
            : period.value === 'weekly'
              ? addWeeks(d, 1).toISOString()
              : period.value === 'monthly'
                ? addMonths(d, 1).toISOString()
                : addYears(d, 1).toISOString()
      }
      if (Object.keys(patch).length) {
        await tasks.update(t.id, patch)
        count += 1
      }
    }
    dashboard.invalidate()
    toast.success(`Rolled over ${count} unfinished task${count === 1 ? '' : 's'}`)
  } catch (err) {
    toast.error('Rollover failed', err?.message)
  } finally {
    rolling.value = false
  }
}

// ---------------------------------------------------------------------------
// Export plan as Markdown
// ---------------------------------------------------------------------------
async function exportPlan() {
  const lines = []
  lines.push(`# ${PERIOD_LABELS[period.value]} Plan — ${label.value}`)
  lines.push('')
  lines.push(`_${stats.value.completed}/${stats.value.total} completed (${completionRate.value}%)_`)
  lines.push('')
  if (filteredPeriodTasks.value.length) {
    lines.push('## Tasks')
    for (const t of filteredPeriodTasks.value) {
      const box = t.isCompleted ? '[x]' : '[ ]'
      lines.push(`- ${box} ${t.title}${t.priority ? ` _(${t.priority})_` : ''}${t.deadline ? ` — due ${format(new Date(t.deadline), 'MMM d, yyyy')}` : ''}`)
    }
    lines.push('')
  }
  if (filteredUnscheduled.value.length) {
    lines.push('## Unscheduled')
    for (const t of filteredUnscheduled.value) {
      const box = t.isCompleted ? '[x]' : '[ ]'
      lines.push(`- ${box} ${t.title}`)
    }
    lines.push('')
  }
  const md = lines.join('\n')
  try {
    await navigator.clipboard.writeText(md)
    toast.success('Plan copied as Markdown')
  } catch {
    toast.info('Clipboard unavailable — printing instead')
    window.print()
  }
}

function resetFilters() {
  search.value = ''
  statusFilter.value = ''
  priorityFilter.value = ''
  categoryFilter.value = ''
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <PageHeader :title="heading" :description="`${label} · ${PERIOD_DESCRIPTIONS[period]}`">
      <template #actions>
        <div class="flex flex-wrap items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Previous" @click="shift(-1)">
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <Button variant="outline" @click="goToday">Today</Button>
          <Button variant="outline" size="icon" aria-label="Next" @click="shift(1)">
            <ChevronRight class="h-4 w-4" />
          </Button>
          <Button variant="outline" @click="rollover" :disabled="rolling">
            <RefreshCw class="h-4 w-4" :class="rolling && 'animate-spin'" />
            <span class="hidden sm:inline">Roll over unfinished</span>
          </Button>
          <Button variant="outline" @click="exportPlan">
            <Copy class="h-4 w-4" />
            <span class="hidden sm:inline">Export</span>
          </Button>
          <Button @click="openCreate()">
            <Plus class="h-4 w-4" />
            <span class="hidden sm:inline">Add task</span>
          </Button>
        </div>
      </template>
    </PageHeader>

    <LoadingState v-if="tasks.loading && !tasks.loaded" />

    <ErrorState
      v-else-if="tasks.error && !tasks.items.length"
      title="Could not load tasks"
      :description="tasks.error"
      @retry="tasks.load({}, { force: true })"
    />

    <template v-else>
      <!-- Stats -->
      <Card>
        <CardContent class="space-y-3 pt-4">
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span class="font-medium">{{ stats.total }} in this {{ period }}</span>
            <span class="text-success">{{ stats.completed }} completed</span>
            <span v-if="stats.inProgress" class="text-info">{{ stats.inProgress }} in progress</span>
            <span v-if="stats.pending" class="text-muted-foreground">{{ stats.pending }} pending</span>
            <span v-if="stats.overdue" class="text-destructive">{{ stats.overdue }} overdue</span>
            <span class="ml-auto text-xs text-muted-foreground">{{ completionRate }}% done</span>
          </div>
          <Progress :model-value="completionRate" class="h-2" />
        </CardContent>
      </Card>

      <!-- Filters -->
      <Card>
        <CardContent class="grid gap-2.5 pt-3.5 sm:pt-4 lg:grid-cols-12">
          <div class="relative lg:col-span-4">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input v-model="search" placeholder="Search tasks..." class="pl-9" />
          </div>
          <Select v-model="statusFilter" class="lg:col-span-2" aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="overdue">Overdue</option>
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </Select>
          <Select v-model="priorityFilter" class="lg:col-span-2" aria-label="Filter by priority">
            <option value="">All priorities</option>
            <option v-for="p in TASK_PRIORITIES" :key="p.value" :value="p.value">{{ p.label }}</option>
          </Select>
          <Select v-model="categoryFilter" class="lg:col-span-2" aria-label="Filter by category">
            <option value="">All categories</option>
            <option v-for="c in categories.items" :key="c.id" :value="c.id">{{ c.name }}</option>
          </Select>
          <div class="flex items-center gap-2 lg:col-span-2">
            <Button variant="outline" size="sm" @click="resetFilters">
              <Filter class="h-3.5 w-3.5" /> Clear
            </Button>
            <span class="text-xs text-muted-foreground">
              {{ filteredPeriodTasks.length }} shown
            </span>
          </div>
        </CardContent>
      </Card>

      <!-- Weekly -->
      <Card v-if="period === 'weekly'">
        <CardContent class="grid gap-2 pt-4 sm:grid-cols-2 lg:grid-cols-7">
          <div v-for="day in weekDays" :key="day.toISOString()" class="space-y-2">
            <button
              type="button"
              class="flex w-full items-center justify-between rounded-md px-2 py-1 text-xs font-semibold"
              :class="isSameDay(day, today) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'"
              @click="openDay(day)"
            >
              <span>{{ format(day, 'EEE') }}</span>
              <span>{{ getDate(day) }}</span>
            </button>
            <div class="space-y-1.5">
              <PlanTaskItem
                v-for="task in applyFilters(tasksForDay(day))"
                :key="task.id"
                :task="task"
                :category="task.categoryId ? categoryById[task.categoryId] : null"
                compact
                @toggle-complete="toggleComplete(task)"
              />
              <p v-if="!applyFilters(tasksForDay(day)).length" class="px-2 text-xs text-muted-foreground/70">—</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Monthly -->
      <Card v-else-if="period === 'monthly'">
        <CardContent class="pt-4">
          <div class="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
            <span v-for="d in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" :key="d">{{ d }}</span>
          </div>
          <div class="mt-1 space-y-1">
            <div v-for="(week, wi) in monthWeeks" :key="wi" class="grid grid-cols-7 gap-1">
              <button
                v-for="day in week"
                :key="day.toISOString()"
                type="button"
                class="min-h-20 rounded-md border p-1.5 text-left transition-colors hover:border-primary/40"
                :class="[
                  isSameMonth(day, range.start) ? 'bg-card' : 'bg-muted/30 text-muted-foreground',
                  isSameDay(day, today) && 'border-primary',
                ]"
                @click="openDay(day)"
              >
                <span class="text-xs font-medium">{{ getDate(day) }}</span>
                <div class="mt-1 space-y-0.5">
                  <span
                    v-for="task in applyFilters(tasksForDay(day)).slice(0, 3)"
                    :key="task.id"
                    class="flex items-center gap-1 truncate text-[11px]"
                  >
                    <span
                      class="h-1.5 w-1.5 shrink-0 rounded-full"
                      :style="{ backgroundColor: task.categoryId && categoryById[task.categoryId] ? categoryById[task.categoryId].color : '#94a3b8' }"
                    />
                    <span :class="task.isCompleted && 'line-through'">{{ task.title }}</span>
                  </span>
                  <span
                    v-if="applyFilters(tasksForDay(day)).length > 3"
                    class="block text-[11px] text-muted-foreground"
                  >
                    +{{ applyFilters(tasksForDay(day)).length - 3 }} more
                  </span>
                </div>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Yearly -->
      <div v-else-if="period === 'yearly'" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <button
          v-for="month in monthNames"
          :key="month.label"
          type="button"
          class="rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/40"
          @click="openMonth(month.date)"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold">{{ month.label }}</span>
            <span class="text-xs text-muted-foreground">{{ month.count }} tasks</span>
          </div>
          <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              class="h-full rounded-full bg-primary"
              :style="{ width: `${month.count ? (month.completed / month.count) * 100 : 0}%` }"
            />
          </div>
          <p class="mt-1.5 text-xs text-muted-foreground">{{ month.completed }} completed</p>
        </button>
      </div>

      <!-- Period task list -->
      <div v-if="period !== 'yearly'" class="space-y-3">
        <h2 class="text-sm font-semibold text-muted-foreground">
          Tasks this {{ period }} ({{ filteredPeriodTasks.length }})
        </h2>
        <EmptyState
          v-if="!filteredPeriodTasks.length"
          title="Nothing scheduled"
          description="No tasks fall within this period."
        >
          <template #icon><CalendarDays class="h-5 w-5" /></template>
          <template #action>
            <Button @click="openCreate()">
              <Plus class="h-4 w-4" /> Add task
            </Button>
          </template>
        </EmptyState>
        <div v-else class="space-y-1.5">
          <PlanTaskItem
            v-for="task in filteredPeriodTasks"
            :key="task.id"
            :task="task"
            :category="task.categoryId ? categoryById[task.categoryId] : null"
            @toggle-complete="toggleComplete(task)"
            @edit="openEdit(task)"
          />
        </div>
      </div>

      <div v-if="filteredUnscheduled.length" class="space-y-3">
        <h2 class="text-sm font-semibold text-muted-foreground">Unscheduled</h2>
        <div class="space-y-1.5">
          <PlanTaskItem
            v-for="task in filteredUnscheduled"
            :key="task.id"
            :task="task"
            :category="task.categoryId ? categoryById[task.categoryId] : null"
            @toggle-complete="toggleComplete(task)"
            @edit="openEdit(task)"
          />
        </div>
      </div>
    </template>

    <ResourceFormDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit task' : 'New task'"
      :description="editing ? 'Update this task.' : 'Add a task to this plan.'"
      :fields="fields"
      :schema="taskSchema"
      :initial="editing || createInitial"
      :submit-label="editing ? 'Save changes' : 'Create task'"
      @submit="submit"
    />
  </div>
</template>
