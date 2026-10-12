<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  Archive,
  CalendarRange,
  Check,
  ChevronDown,
  CircleCheckBig,
  ListTodo,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Target,
  Trash2,
} from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ResourceFormDialog from '@/components/forms/ResourceFormDialog.vue'
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog.vue'
import PlanStatusBadge from '@/components/plans/PlanStatusBadge.vue'
import PlanProgressBar from '@/components/plans/PlanProgressBar.vue'
import PlanCompleteDialog from '@/components/plans/PlanCompleteDialog.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Select from '@/components/ui/Select.vue'
import { cn } from '@/lib/utils'
import { formatDate, formatDue } from '@/lib/format'
import {
  PLAN_PERIODS,
  PLAN_STATUSES,
  PRIORITIES,
  planPeriodMeta,
  planStatusMeta,
  priorityMeta,
  statusMeta,
} from '@/lib/constants'
import { computePlanProgress, derivedPlanStatus, summarizePlans } from '@/lib/planProgress'
import { planSchema } from '@/schemas'
import { usePlansStore } from '@/stores/plans'
import { useTasksStore } from '@/stores/tasks'
import { useToast } from '@/composables/useToast'

const plansStore = usePlansStore()
const tasksStore = useTasksStore()
const toast = useToast()

const search = ref('')
const periodFilter = ref('')
const statusFilter = ref('')
const sortBy = ref('deadline')

const dialogOpen = ref(false)
const editing = ref(null)
const deleteOpen = ref(false)
const deleting = ref(null)
const deleteLoading = ref(false)

const completeOpen = ref(false)
const completing = ref(null)
const completeLoading = ref(false)

const expanded = ref(null)

onMounted(async () => {
  await Promise.all([plansStore.load(), tasksStore.load()])
})

const periodOptions = PLAN_PERIODS.map((p) => ({ label: planPeriodMeta[p].label, value: p }))
const priorityOptions = PRIORITIES.map((p) => ({ label: priorityMeta[p].label, value: p }))
const planStatusOptions = PLAN_STATUSES.map((s) => ({ label: planStatusMeta[s].label, value: s }))

const fields = [
  { name: 'title', label: 'Title', type: 'text', required: true, span: 2, placeholder: 'e.g. Weekly sprint plan' },
  { name: 'description', label: 'Description', type: 'textarea', span: 2, rows: 2, placeholder: 'What is this plan about?' },
  { name: 'period', label: 'Period', type: 'select', required: true, options: periodOptions, default: 'weekly' },
  { name: 'priority', label: 'Priority', type: 'select', required: true, options: priorityOptions, default: 'medium' },
  { name: 'status', label: 'Status', type: 'select', required: true, options: planStatusOptions, default: 'active' },
  { name: 'startDate', label: 'Start date', type: 'datetime' },
  { name: 'deadline', label: 'Deadline', type: 'datetime' },
  {
    name: 'expectedResults',
    label: 'Expected results',
    type: 'textarea',
    span: 2,
    rows: 2,
    placeholder: 'What does success look like? (Used to compare against actual results.)',
  },
]

/** Every plan paired with its derived progress. */
const allRows = computed(() =>
  plansStore.items.map((plan) => {
    const progress = computePlanProgress(plan, tasksStore.items)
    return { plan, progress, status: derivedPlanStatus(plan, progress) }
  }),
)

const summary = computed(() => summarizePlans(plansStore.items, tasksStore.items))

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 }

const rows = computed(() => {
  const term = search.value.trim().toLowerCase()
  let list = allRows.value.filter(({ plan, status }) => {
    if (periodFilter.value && plan.period !== periodFilter.value) return false
    if (statusFilter.value && status !== statusFilter.value) return false
    if (term && !`${plan.title} ${plan.description ?? ''}`.toLowerCase().includes(term)) return false
    return true
  })

  list = [...list]
  if (sortBy.value === 'deadline') {
    list.sort((a, b) => {
      const ad = a.progress.deadline ? a.progress.deadline.getTime() : Infinity
      const bd = b.progress.deadline ? b.progress.deadline.getTime() : Infinity
      return ad - bd
    })
  } else if (sortBy.value === 'priority') {
    list.sort((a, b) => PRIORITY_ORDER[a.plan.priority] - PRIORITY_ORDER[b.plan.priority])
  } else if (sortBy.value === 'progress') {
    list.sort((a, b) => b.progress.percent - a.progress.percent)
  } else if (sortBy.value === 'created') {
    list.sort((a, b) => new Date(b.plan.createdAt || 0) - new Date(a.plan.createdAt || 0))
  }
  return list
})

const summaryCards = computed(() => [
  { label: 'Total', value: summary.value.total, accent: 'var(--color-primary)' },
  { label: 'Active', value: summary.value.active, accent: '#0ea5e9' },
  { label: 'Overdue', value: summary.value.overdue, accent: 'var(--color-destructive)' },
  { label: 'Completed', value: summary.value.completed, accent: 'var(--color-success)' },
  { label: 'Avg progress', value: `${summary.value.avgProgress}%`, accent: '#8b5cf6' },
])

function tasksForPlan(planId) {
  return tasksStore.items
    .filter((t) => t.planId === planId)
    .sort((a, b) => (a.status === 'completed') - (b.status === 'completed'))
}

function openCreate() {
  editing.value = null
  dialogOpen.value = true
}
function openEdit(plan) {
  editing.value = plan
  dialogOpen.value = true
}
function askDelete(plan) {
  deleting.value = plan
  deleteOpen.value = true
}
function askComplete(plan) {
  completing.value = plan
  completeOpen.value = true
}
function toggleExpanded(planId) {
  expanded.value = expanded.value === planId ? null : planId
}

async function submit(values) {
  try {
    if (editing.value) {
      await plansStore.update(editing.value.id, values)
      toast.success('Plan updated')
    } else {
      await plansStore.create(values)
      toast.success('Plan created')
    }
  } catch (err) {
    toast.error('Could not save plan', err?.message)
    throw err
  }
}

async function confirmDelete() {
  deleteLoading.value = true
  try {
    await plansStore.remove(deleting.value.id)
    await tasksStore.load(true)
    toast.success('Plan deleted')
    deleteOpen.value = false
  } catch (err) {
    toast.error('Could not delete plan', err?.message)
  } finally {
    deleteLoading.value = false
  }
}

async function confirmComplete({ actualResults }) {
  completeLoading.value = true
  try {
    await plansStore.update(completing.value.id, { status: 'completed', actualResults })
    toast.success('Plan completed')
    completeOpen.value = false
  } catch (err) {
    toast.error('Could not complete plan', err?.message)
  } finally {
    completeLoading.value = false
  }
}

async function reopen(plan) {
  try {
    await plansStore.update(plan.id, { status: 'active' })
    toast.success('Plan reopened')
  } catch (err) {
    toast.error('Could not reopen plan', err?.message)
  }
}

async function archive(plan) {
  try {
    await plansStore.update(plan.id, { status: 'archived' })
    toast.success('Plan archived')
  } catch (err) {
    toast.error('Could not archive plan', err?.message)
  }
}

async function toggleTask(task) {
  const next = task.status === 'completed' ? 'todo' : 'completed'
  try {
    await tasksStore.update(task.id, { status: next })
  } catch (err) {
    toast.error('Could not update task', err?.message)
  }
}

const completingProgress = computed(() =>
  completing.value ? computePlanProgress(completing.value, tasksStore.items) : null,
)
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <PageHeader
      title="Plans"
      description="Daily, weekly, monthly and yearly plans with live progress tracking."
    >
      <template #actions>
        <Button @click="openCreate">
          <Plus class="h-4 w-4" />
          Add plan
        </Button>
      </template>
    </PageHeader>

    <div v-if="plansStore.error" class="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      Could not load plans ({{ plansStore.error }}). If you just added this feature, run
      <code>supabase/migrations/0003_plans.sql</code> in your Supabase SQL editor, then
      <button class="font-medium underline" @click="plansStore.load(true)">retry</button>.
    </div>

    <template v-else>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <Card v-for="card in summaryCards" :key="card.label" class="relative overflow-hidden p-3.5">
          <span class="absolute inset-x-0 top-0 h-1" :style="{ backgroundColor: card.accent }" />
          <p class="text-xs text-muted-foreground">{{ card.label }}</p>
          <p class="text-xl font-semibold tabular-nums">{{ card.value }}</p>
        </Card>
      </div>

      <Card>
        <CardContent class="flex flex-col gap-2.5 pt-3.5 sm:pt-4 lg:flex-row lg:items-center">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input v-model="search" placeholder="Search plans..." class="pl-9" />
          </div>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-auto lg:grid-cols-3">
            <Select v-model="periodFilter">
              <option value="">All periods</option>
              <option v-for="p in PLAN_PERIODS" :key="p" :value="p">{{ planPeriodMeta[p].label }}</option>
            </Select>
            <Select v-model="statusFilter">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </Select>
            <Select v-model="sortBy">
              <option value="deadline">Deadline</option>
              <option value="progress">Progress</option>
              <option value="priority">Priority</option>
              <option value="created">Newest</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <LoadingState v-if="plansStore.loading && !plansStore.loaded" :rows="3" />

      <EmptyState
        v-else-if="!rows.length"
        title="No plans yet"
        description="Create a daily, weekly, monthly or yearly plan and track it to completion."
      >
        <template #icon><CalendarRange class="h-5 w-5" /></template>
        <template #action>
          <Button @click="openCreate"><Plus class="h-4 w-4" /> Add plan</Button>
        </template>
      </EmptyState>

      <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Card
          v-for="{ plan, progress, status } in rows"
          :key="plan.id"
          class="group flex flex-col"
          :class="status === 'overdue' ? 'border-destructive/40' : ''"
        >
          <CardHeader class="flex-row items-start justify-between space-y-0">
            <div class="min-w-0 space-y-1">
              <CardTitle class="flex flex-wrap items-center gap-2">
                <span class="truncate">{{ plan.title }}</span>
                <Badge :variant="planPeriodMeta[plan.period]?.variant || 'muted'">
                  {{ planPeriodMeta[plan.period]?.label || plan.period }}
                </Badge>
                <PlanStatusBadge :status="status" />
              </CardTitle>
              <p v-if="plan.description" class="line-clamp-2 text-xs text-muted-foreground">
                {{ plan.description }}
              </p>
            </div>
            <div class="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
              <Button variant="ghost" size="icon" aria-label="Edit plan" @click="openEdit(plan)">
                <Pencil class="h-4 w-4" />
              </Button>
              <Button
                v-if="status !== 'completed'"
                variant="ghost"
                size="icon"
                aria-label="Complete plan"
                @click="askComplete(plan)"
              >
                <CircleCheckBig class="h-4 w-4 text-success" />
              </Button>
              <Button
                v-else
                variant="ghost"
                size="icon"
                aria-label="Reopen plan"
                @click="reopen(plan)"
              >
                <RotateCcw class="h-4 w-4" />
              </Button>
              <Button
                v-if="status !== 'archived' && status !== 'completed'"
                variant="ghost"
                size="icon"
                aria-label="Archive plan"
                @click="archive(plan)"
              >
                <Archive class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Delete plan" @click="askDelete(plan)">
                <Trash2 class="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardHeader>

          <CardContent class="flex flex-1 flex-col gap-3">
            <PlanProgressBar
              :progress="progress"
              :plan="plan"
              :accent="planPeriodMeta[plan.period]?.accent || 'var(--color-primary)'"
            />

            <div v-if="plan.expectedResults && status !== 'completed'" class="rounded-lg border bg-primary/5 p-2.5">
              <p class="flex items-center gap-1.5 text-xs font-medium text-primary">
                <Target class="h-3.5 w-3.5" />
                Expected results
              </p>
              <p class="mt-0.5 line-clamp-3 text-xs text-muted-foreground">{{ plan.expectedResults }}</p>
            </div>

            <div v-if="status === 'completed'" class="space-y-2 rounded-lg border bg-success/5 p-2.5">
              <div class="flex items-center justify-between text-xs">
                <span class="flex items-center gap-1.5 font-medium text-success">
                  <CircleCheckBig class="h-3.5 w-3.5" />
                  Completed
                </span>
                <span class="text-muted-foreground">
                  {{ plan.completedAt ? formatDate(plan.completedAt, 'MMM d, yyyy · h:mm a') : '' }}
                </span>
              </div>
              <div class="grid gap-1 text-xs">
                <p v-if="plan.expectedResults">
                  <span class="font-medium">Expected:</span>
                  <span class="text-muted-foreground"> {{ plan.expectedResults }}</span>
                </p>
                <p>
                  <span class="font-medium">Actual:</span>
                  <span class="text-muted-foreground">
                    {{ plan.actualResults || 'No results recorded' }}
                  </span>
                </p>
                <p><span class="font-medium">Final progress:</span> {{ progress.percent }}%</p>
              </div>
            </div>

            <div class="mt-auto flex items-center justify-between pt-1">
              <div class="flex items-center gap-2">
                <Badge :variant="priorityMeta[plan.priority]?.variant || 'muted'">
                  {{ priorityMeta[plan.priority]?.label || plan.priority }}
                </Badge>
                <span v-if="plan.deadline" class="text-xs text-muted-foreground">
                  {{ formatDate(plan.deadline, 'MMM d') }}
                </span>
              </div>
              <Button variant="ghost" size="sm" @click="toggleExpanded(plan.id)">
                Tasks ({{ progress.total }})
                <ChevronDown
                  :class="cn('h-4 w-4 transition-transform', expanded === plan.id && 'rotate-180')"
                />
              </Button>
            </div>

            <div v-if="expanded === plan.id" class="space-y-1.5 rounded-lg border bg-muted/30 p-2.5">
              <ul v-if="tasksForPlan(plan.id).length" class="space-y-1">
                <li
                  v-for="task in tasksForPlan(plan.id)"
                  :key="task.id"
                  class="flex items-center gap-2 text-sm"
                >
                  <button
                    type="button"
                    :class="
                      cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                        task.status === 'completed'
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/40 hover:border-primary',
                      )
                    "
                    :aria-label="task.status === 'completed' ? 'Mark to do' : 'Mark complete'"
                    @click="toggleTask(task)"
                  >
                    <Check v-if="task.status === 'completed'" class="h-2.5 w-2.5" />
                  </button>
                  <span
                    :class="cn('min-w-0 flex-1 truncate', task.status === 'completed' && 'text-muted-foreground line-through')"
                  >
                    {{ task.title }}
                  </span>
                  <Badge :variant="statusMeta[task.status]?.variant || 'muted'" class="hidden sm:inline-flex">
                    {{ statusMeta[task.status]?.label || task.status }}
                  </Badge>
                  <span v-if="task.dueDate" class="text-xs text-muted-foreground">
                    {{ formatDue(task.dueDate) }}
                  </span>
                </li>
              </ul>
              <p v-else class="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ListTodo class="h-3.5 w-3.5" />
                No tasks linked yet. Add tasks and choose this plan to track progress.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>

    <ResourceFormDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit plan' : 'New plan'"
      :description="editing ? 'Update the details and expectations of this plan.' : 'Define a time-bound plan to work towards.'"
      :fields="fields"
      :schema="planSchema"
      :initial="editing"
      :submit-label="editing ? 'Save changes' : 'Create plan'"
      @submit="submit"
    />

    <PlanCompleteDialog
      v-model:open="completeOpen"
      :plan="completing"
      :progress="completingProgress"
      :submitting="completeLoading"
      @confirm="confirmComplete"
    />

    <ConfirmDeleteDialog
      v-model:open="deleteOpen"
      title="Delete plan"
      :description="`Delete “${deleting?.title ?? ''}”? Linked tasks are kept but will no longer belong to a plan.`"
      :loading="deleteLoading"
      @confirm="confirmDelete"
    />
  </div>
</template>
