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
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PlanTaskItem from '@/components/plan/PlanTaskItem.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTasksStore } from '@/stores/tasks'
import { useCategoriesStore } from '@/stores/categories'
import { useDashboardStore } from '@/stores/dashboard'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const tasks = useTasksStore()
const categories = useCategoriesStore()
const dashboard = useDashboardStore()
const toast = useToast()

const PERIOD_LABELS = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }

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
const categoryById = computed(() => Object.fromEntries(categories.items.map((c) => [c.id, c])))

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

const periodTasks = computed(() =>
  all.value.filter((t) => overlaps(t, range.value.start, range.value.end)).sort(byDeadline),
)
const unscheduled = computed(() => all.value.filter((t) => !t.startDate && !t.deadline))

const stats = computed(() => {
  const list = periodTasks.value
  return {
    total: list.length,
    completed: list.filter((t) => t.isCompleted).length,
    overdue: list.filter((t) => t.overdue).length,
  }
})

const weekDays = computed(() =>
  period.value === 'weekly' ? eachDayOfInterval(range.value) : [],
)

function tasksForDay(day) {
  const s = startOfDay(day)
  const e = endOfDay(day)
  return all.value.filter((t) => overlaps(t, s, e)).sort(byDeadline)
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
    const list = all.value.filter((t) => overlaps(t, ms, endOfMonth(ms)))
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
  const progress = (task.progress ?? 0) >= 100 ? 0 : 100
  try {
    await tasks.update(task.id, { progress })
    dashboard.invalidate()
  } catch (err) {
    toast.error('Could not update task', err?.message)
  }
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <PageHeader :title="heading" :description="label">
      <template #actions>
        <div class="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Previous" @click="shift(-1)">
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <Button variant="outline" @click="goToday">Today</Button>
          <Button variant="outline" size="icon" aria-label="Next" @click="shift(1)">
            <ChevronRight class="h-4 w-4" />
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
      <div class="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>{{ stats.total }} in this {{ period }}</span>
        <span class="text-success">{{ stats.completed }} completed</span>
        <span v-if="stats.overdue" class="text-destructive">{{ stats.overdue }} overdue</span>
      </div>

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
                v-for="task in tasksForDay(day)"
                :key="task.id"
                :task="task"
                :category="task.categoryId ? categoryById[task.categoryId] : null"
                compact
                @toggle-complete="toggleComplete(task)"
              />
              <p v-if="!tasksForDay(day).length" class="px-2 text-xs text-muted-foreground/70">—</p>
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
                    v-for="task in tasksForDay(day).slice(0, 3)"
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
                    v-if="tasksForDay(day).length > 3"
                    class="block text-[11px] text-muted-foreground"
                  >
                    +{{ tasksForDay(day).length - 3 }} more
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
          Tasks this {{ period }}
        </h2>
        <EmptyState
          v-if="!periodTasks.length"
          title="Nothing scheduled"
          description="No tasks fall within this period."
        >
          <template #icon><CalendarDays class="h-5 w-5" /></template>
        </EmptyState>
        <div v-else class="space-y-1.5">
          <PlanTaskItem
            v-for="task in periodTasks"
            :key="task.id"
            :task="task"
            :category="task.categoryId ? categoryById[task.categoryId] : null"
            @toggle-complete="toggleComplete(task)"
          />
        </div>
      </div>

      <div v-if="unscheduled.length" class="space-y-3">
        <h2 class="text-sm font-semibold text-muted-foreground">Unscheduled</h2>
        <div class="space-y-1.5">
          <PlanTaskItem
            v-for="task in unscheduled"
            :key="task.id"
            :task="task"
            :category="task.categoryId ? categoryById[task.categoryId] : null"
            @toggle-complete="toggleComplete(task)"
          />
        </div>
      </div>
    </template>
  </div>
</template>
