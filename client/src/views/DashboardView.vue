<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { toast } from 'vue-sonner'
import { format, isSameDay, subDays } from 'date-fns'
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  FolderKanban,
  ListTodo,
  Loader,
  Plus,
  Target,
  TrendingUp,
} from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { useTasksStore } from '@/stores/tasks'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import CompletionChart from '@/components/dashboard/CompletionChart.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ResourceFormDialog from '@/components/forms/ResourceFormDialog.vue'
import TaskStatusBadge from '@/components/tasks/TaskStatusBadge.vue'
import TaskPriorityBadge from '@/components/tasks/TaskPriorityBadge.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDue, formatRelative, formatTime } from '@/lib/format'
import { PRIORITIES, TASK_STATUSES, priorityMeta, statusMeta } from '@/lib/constants'
import { taskSchema } from '@/schemas'

const store = useDashboardStore()
const tasksStore = useTasksStore()
const { tasks } = storeToRefs(store)

const quickAddOpen = ref(false)
const quickFields = [
  { name: 'title', label: 'Title', type: 'text', required: true, span: 2, placeholder: 'e.g. Draft project proposal' },
  { name: 'priority', label: 'Priority', type: 'select', options: PRIORITIES.map((p) => ({ label: priorityMeta[p].label, value: p })) },
  { name: 'status', label: 'Status', type: 'select', options: TASK_STATUSES.map((s) => ({ label: statusMeta[s].label, value: s })) },
  { name: 'dueDate', label: 'Due date', type: 'datetime', span: 2 },
]

async function quickAddTask(values) {
  try {
    await tasksStore.create(values)
    toast.success('Task added')
  } catch (err) {
    toast.error('Could not add task', err?.message)
    throw err
  }
}

const range = ref(7)
const rangeOptions = [
  { label: '7D', value: 7 },
  { label: '14D', value: 14 },
  { label: '30D', value: 30 },
]

const chart = computed(() => {
  const labels = []
  const completed = []
  const created = []
  for (let i = range.value - 1; i >= 0; i--) {
    const day = subDays(new Date(), i)
    labels.push(format(day, range.value > 10 ? 'd' : 'EEE'))
    completed.push(
      tasks.value.filter((t) => t.completedAt && isSameDay(new Date(t.completedAt), day)).length,
    )
    created.push(
      tasks.value.filter((t) => t.createdAt && isSameDay(new Date(t.createdAt), day)).length,
    )
  }
  return { labels, completed, created }
})

const activityIcon = (type) => {
  if (type === 'task_completed') return CheckCircle2
  if (type === 'task_created') return Plus
  if (type === 'goal_updated') return Target
  return Activity
}

onMounted(() => {
  if (!store.loadedAt) store.load()
})
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Dashboard"
      description="A snapshot of your tasks, goals and projects."
    >
      <template #actions>
        <div class="flex items-center rounded-md border bg-card p-0.5">
          <button
            v-for="opt in rangeOptions"
            :key="opt.value"
            type="button"
            :class="
              cn(
                'rounded-[5px] px-2.5 py-1 text-xs font-medium transition-colors',
                range === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )
            "
            @click="range = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
        <Button @click="quickAddOpen = true">
          <Plus class="h-4 w-4" />
          Add task
        </Button>
      </template>
    </PageHeader>

    <LoadingState v-if="store.loading && !store.loadedAt" :rows="6" />
    <ErrorState
      v-else-if="store.error"
      :description="store.error"
      @retry="store.load()"
    />

    <template v-else>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Total tasks" :value="store.totalTasks" :icon="ListTodo" hint="All time" tone="primary" />
        <StatCard
          title="Completed today"
          :value="store.completedToday"
          :icon="CheckCircle2"
          tone="success"
          hint="Since midnight"
        />
        <StatCard title="In progress" :value="store.inProgress" :icon="Loader" tone="primary" hint="Currently active" />
        <StatCard
          title="Overdue"
          :value="store.overdue.length"
          :icon="AlertTriangle"
          tone="destructive"
          hint="Past due date"
        />
        <StatCard title="Active projects" :value="store.activeProjects.length" :icon="FolderKanban" tone="muted" hint="In flight" />
        <StatCard
          title="Active goals"
          :value="store.activeGoals.length"
          :icon="Target"
          tone="warning"
          :hint="`${store.goalCompletion}% avg progress`"
        />
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card class="lg:col-span-2">
          <CardHeader class="flex-row items-center justify-between space-y-0">
            <div class="space-y-1">
              <CardTitle>Activity overview</CardTitle>
              <CardDescription>Tasks created vs completed</CardDescription>
            </div>
            <Badge variant="info" class="hidden sm:inline-flex">
              <TrendingUp class="h-3 w-3" />
              {{ store.completionRate }} completed
            </Badge>
          </CardHeader>
          <CardContent>
            <CompletionChart
              :labels="chart.labels"
              :completed="chart.completed"
              :created="chart.created"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Clock class="h-4 w-4 text-primary" />
              Today's schedule
            </CardTitle>
            <CardDescription>{{ store.todaysEvents.length }} event(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              v-if="!store.todaysEvents.length"
              title="Nothing scheduled"
              description="Your calendar is clear today."
              class="border-0 bg-transparent py-6"
            >
              <template #icon><CalendarClock class="h-5 w-5" /></template>
            </EmptyState>
            <ul v-else class="space-y-3">
              <li
                v-for="event in store.todaysEvents"
                :key="event.id"
                class="flex items-start gap-3 rounded-lg border p-3"
              >
                <span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{{ event.title }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ formatTime(event.startTime) }} – {{ formatTime(event.endTime) }}
                  </p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card class="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming deadlines</CardTitle>
            <CardDescription>Due in the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              v-if="!store.upcomingTasks.length"
              title="No upcoming tasks"
              description="You have no tasks due in the next 7 days."
              class="border-0 bg-transparent py-6"
            >
              <template #icon><ListTodo class="h-5 w-5" /></template>
            </EmptyState>
            <ul v-else class="divide-y">
              <li
                v-for="task in store.upcomingTasks"
                :key="task.id"
                class="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{{ task.title }}</p>
                  <p class="text-xs text-muted-foreground">{{ formatDue(task.dueDate) }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <TaskPriorityBadge :priority="task.priority" />
                  <TaskStatusBadge :status="task.status" />
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Target class="h-4 w-4 text-primary" />
              Goal progress
            </CardTitle>
            <CardDescription>{{ store.goalCompletion }}% average</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <EmptyState
              v-if="!store.activeGoals.length"
              title="No active goals"
              description="Set a goal to track your progress."
              class="border-0 bg-transparent py-6"
            >
              <template #icon><Target class="h-5 w-5" /></template>
            </EmptyState>
            <div v-for="goal in store.activeGoals" :key="goal.id" class="space-y-2">
              <div class="flex items-center justify-between gap-2 text-sm">
                <span class="truncate font-medium">{{ goal.title }}</span>
                <span class="shrink-0 text-muted-foreground">{{ goal.progress }}%</span>
              </div>
              <Progress :model-value="goal.progress" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>What happened lately</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            v-if="!store.recentActivities.length"
            title="No activity yet"
            description="Actions you take will appear here."
            class="border-0 bg-transparent py-6"
          >
            <template #icon><Activity class="h-5 w-5" /></template>
          </EmptyState>
          <ul v-else class="space-y-1">
            <li
              v-for="item in store.recentActivities"
              :key="item.id"
              class="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50"
            >
              <span class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <component :is="activityIcon(item.type)" class="h-4 w-4" />
              </span>
              <span class="min-w-0 flex-1 truncate text-sm">{{ item.label }}</span>
              <span class="shrink-0 text-xs text-muted-foreground">{{ formatRelative(item.at) }}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </template>

    <ResourceFormDialog
      v-model:open="quickAddOpen"
      title="Quick add task"
      description="Capture a task in seconds."
      :fields="quickFields"
      :schema="taskSchema"
      submit-label="Add task"
      @submit="quickAddTask"
    />
  </div>
</template>
