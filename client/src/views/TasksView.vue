<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { ArrowDownUp, Calendar, CalendarClock, CalendarDays, CalendarRange, ListTodo, Loader2, Plus, Search } from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ResourceFormDialog from '@/components/forms/ResourceFormDialog.vue'
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog.vue'
import TaskListItem from '@/components/tasks/TaskListItem.vue'
import TaskPriorityBadge from '@/components/tasks/TaskPriorityBadge.vue'
import TaskPlanBadge from '@/components/tasks/TaskPlanBadge.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Select from '@/components/ui/Select.vue'
import { taskSchema } from '@/schemas'
import { TASK_PRIORITIES, TASK_STATUSES, TASK_PLANS, TASK_RECURRENCES } from '@/lib/constants'
import { useI18n } from '@/lib/i18n'
import { parseQuickAdd } from '@/lib/quickAdd'
import { useTasksStore } from '@/stores/tasks'
import { useCategoriesStore } from '@/stores/categories'
import { useDashboardStore } from '@/stores/dashboard'
import { useToast } from '@/composables/useToast'
import { useAccessGate } from '@/composables/useAccessGate'

const route = useRoute()
const router = useRouter()
const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()
const dashboard = useDashboardStore()
const toast = useToast()
const { ensureWrite } = useAccessGate()
const { t } = useI18n()

const search = ref(typeof route.query.search === 'string' ? route.query.search : '')

const viewMode = ref('list') // 'list' | 'board'

const boardColumns = [
  { value: 'not_started', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Done' },
]

function tasksByStatus(status) {
  return tasksStore.items.filter((t) => t.status === status)
}

let draggedId = null
function onDragStart(e, id) {
  draggedId = id
  e.dataTransfer?.setData('text/plain', id)
}
async function onDrop(e, status) {
  e.preventDefault()
  const id = draggedId || e.dataTransfer?.getData('text/plain')
  draggedId = null
  if (!id) return
  const task = tasksStore.items.find((t) => t.id === id)
  if (!task || task.status === status) return
  if (!ensureWrite()) return
  try {
    await tasksStore.update(id, { status, progress: status === 'completed' ? 100 : task.progress })
    dashboard.invalidate()
    toast.success('Task moved')
  } catch (err) {
    toast.error('Could not move task', err?.message)
  }
}

// Quick add (Todoist-style natural language)
const quickText = ref('')
const quickAdding = ref(false)
const quickPreview = computed(() => (quickText.value.trim() ? parseQuickAdd(quickText.value) : null))
const statusFilter = ref('')
const priorityFilter = ref('')
const categoryFilter = ref('')
const sortBy = ref('created_at')
const order = ref('desc')

const dialogOpen = ref(false)
const editing = ref(null)
const deleteOpen = ref(false)
const deleting = ref(null)
const deleteLoading = ref(false)

const params = computed(() => ({
  search: search.value.trim() || undefined,
  status: statusFilter.value || undefined,
  priority: priorityFilter.value || undefined,
  categoryId: categoryFilter.value || undefined,
  sort: sortBy.value,
  order: order.value,
}))

const reload = useDebounceFn(() => {
  tasksStore.load(params.value, { force: true }).catch(() => {})
}, 250)

watch(params, reload, { deep: true })

onMounted(async () => {
  categoriesStore.load().catch(() => {})
  await tasksStore.load(params.value, { force: true }).catch(() => {})
  if (route.query.new) {
    openCreate()
    router.replace({ query: {} })
  }
})

const categoryById = computed(() =>
  Object.fromEntries(categoriesStore.items.map((c) => [c.id, c])),
)

const categoryOptions = computed(() =>
  categoriesStore.items.map((c) => ({ value: c.id, label: c.name })),
)

const fields = computed(() => [
  { name: 'title', label: 'Title', type: 'text', required: true, span: 2, placeholder: 'e.g. Pour the foundation' },
  {
    name: 'plan',
    label: 'Plan',
    type: 'segmented',
    required: true,
    default: 'daily',
    span: 2,
    help: 'Which planning horizon does this task belong to?',
    options: [
      { value: 'daily', label: 'Daily', description: 'Today', color: '#3b82f6', icon: CalendarDays },
      { value: 'weekly', label: 'Weekly', description: 'This week', color: '#8b5cf6', icon: CalendarRange },
      { value: 'monthly', label: 'Monthly', description: 'This month', color: '#f59e0b', icon: CalendarClock },
      { value: 'yearly', label: 'Yearly', description: 'This year', color: '#22c55e', icon: Calendar },
    ],
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

const doneCount = computed(() => tasksStore.items.filter((t) => t.isCompleted).length)

function resetFilters() {
  search.value = ''
  statusFilter.value = ''
  priorityFilter.value = ''
  categoryFilter.value = ''
}

function openCreate() {
  if (!ensureWrite()) return
  editing.value = null
  dialogOpen.value = true
}

function openEdit(task) {
  if (!ensureWrite()) return
  editing.value = task
  dialogOpen.value = true
}

function askDelete(task) {
  if (!ensureWrite()) return
  deleting.value = task
  deleteOpen.value = true
}

function toggleOrder() {
  order.value = order.value === 'asc' ? 'desc' : 'asc'
}

async function quickAdd() {
  if (!ensureWrite()) return
  const parsed = parseQuickAdd(quickText.value)
  if (!parsed.title) return
  quickAdding.value = true
  try {
    await tasksStore.create({
      title: parsed.title,
      priority: parsed.priority,
      recurrence: parsed.recurrence,
      plan: parsed.plan,
      startDate: parsed.startDate,
      deadline: parsed.deadline,
      status: 'not_started',
      progress: 0,
    })
    dashboard.invalidate()
    toast.success('Task added')
    quickText.value = ''
  } catch (err) {
    toast.error('Could not add task', err?.message)
  } finally {
    quickAdding.value = false
  }
}

async function submit(values) {
  if (!ensureWrite()) return
  try {
    if (editing.value) {
      await tasksStore.update(editing.value.id, values)
      toast.success('Task updated')
    } else {
      await tasksStore.create(values)
      toast.success('Task created')
    }
    dashboard.invalidate()
  } catch (err) {
    toast.error('Could not save task', err?.message)
    throw err
  }
}

async function confirmDelete() {
  deleteLoading.value = true
  try {
    await tasksStore.remove(deleting.value.id)
    dashboard.invalidate()
    toast.success('Task deleted')
    deleteOpen.value = false
  } catch (err) {
    toast.error('Could not delete task', err?.message)
  } finally {
    deleteLoading.value = false
  }
}

async function setProgress(task, value) {
  if (!ensureWrite()) return
  const progress = Math.max(0, Math.min(100, Number(value) || 0))
  if (progress === (task.progress ?? 0)) return
  try {
    await tasksStore.update(task.id, { progress })
    dashboard.invalidate()
    toast.success(progress >= 100 ? 'Task marked complete' : `Progress updated to ${progress}%`)
  } catch (err) {
    toast.error('Could not update progress', err?.message)
  }
}

function toggleComplete(task) {
  setProgress(task, (task.progress ?? 0) >= 100 ? 0 : 100)
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <PageHeader :title="t('page.tasks.title')" :description="t('page.tasks.desc')">
      <template #actions>
        <div class="flex items-center gap-1 rounded-md border p-0.5">
          <Button :variant="viewMode === 'list' ? 'default' : 'ghost'" size="sm" @click="viewMode = 'list'">List</Button>
          <Button :variant="viewMode === 'board' ? 'default' : 'ghost'" size="sm" @click="viewMode = 'board'">Board</Button>
        </div>
        <Button @click="openCreate">
          <Plus class="h-4 w-4" />
          Add task
        </Button>
      </template>
    </PageHeader>

    <Card>
      <CardContent class="space-y-2 pt-3.5 sm:pt-4">
        <div class="flex items-center gap-2">
          <Plus class="h-4 w-4 text-muted-foreground" />
          <Input
            v-model="quickText"
            :placeholder="t('tasks.quickAddPlaceholder')"
            @keydown.enter.prevent="quickAdd"
          />
          <Button :disabled="quickAdding || !quickText.trim()" @click="quickAdd">
            <Loader2 v-if="quickAdding" class="h-4 w-4 animate-spin" />
            Add
          </Button>
        </div>
        <p v-if="quickPreview && quickText.trim()" class="text-xs text-muted-foreground">
          {{ quickPreview.title }}
          <span v-if="quickPreview.priority !== 'medium'" class="ml-1">· {{ quickPreview.priority }}</span>
          <span v-if="quickPreview.recurrence !== 'none'" class="ml-1">· repeats {{ quickPreview.recurrence }}</span>
          <span v-if="quickPreview.deadline" class="ml-1">· due {{ new Date(quickPreview.deadline).toLocaleDateString() }}</span>
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="grid gap-2.5 pt-3.5 sm:pt-4 lg:grid-cols-12">
        <div class="relative lg:col-span-4">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input v-model="search" :placeholder="t('common.search') + '...'" class="pl-9" />
        </div>
        <Select v-model="statusFilter" class="lg:col-span-2" aria-label="Filter by status">
          <option value="">{{ t('tasks.allStatuses') }}</option>
          <option value="active">Active</option>
          <option value="overdue">Overdue</option>
          <option value="not_started">Not started</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </Select>
        <Select v-model="priorityFilter" class="lg:col-span-2" aria-label="Filter by priority">
          <option value="">{{ t('tasks.allPriorities') }}</option>
          <option v-for="p in TASK_PRIORITIES" :key="p.value" :value="p.value">{{ p.label }}</option>
        </Select>
        <Select v-model="categoryFilter" class="lg:col-span-2" aria-label="Filter by category">
          <option value="">{{ t('tasks.allCategories') }}</option>
          <option v-for="c in categoriesStore.items" :key="c.id" :value="c.id">{{ c.name }}</option>
        </Select>
        <div class="flex gap-2 lg:col-span-2">
          <Select v-model="sortBy" aria-label="Sort by">
            <option value="created_at">Newest</option>
            <option value="deadline">Deadline</option>
            <option value="start_date">Start date</option>
            <option value="priority">Priority</option>
            <option value="progress">Progress</option>
            <option value="title">Title</option>
          </Select>
          <Button
            variant="outline"
            size="icon"
            :aria-label="order === 'asc' ? 'Sort descending' : 'Sort ascending'"
            @click="toggleOrder"
          >
            <ArrowDownUp class="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>

    <div class="flex items-center justify-between text-sm text-muted-foreground">
      <span>{{ tasksStore.items.length }} shown · {{ doneCount }} complete</span>
      <button
        v-if="search || statusFilter || priorityFilter || categoryFilter"
        type="button"
        class="text-primary hover:underline"
        @click="resetFilters"
      >
        Clear filters
      </button>
    </div>

    <LoadingState v-if="tasksStore.loading && !tasksStore.loaded" />

    <ErrorState
      v-else-if="tasksStore.error && !tasksStore.items.length"
      :title="t('tasks.couldNotLoad')"
      :description="tasksStore.error"
      @retry="tasksStore.load(params, { force: true })"
    />

    <EmptyState
      v-else-if="!tasksStore.items.length"
      :title="t('tasks.noTasks')"
      :description="t('tasks.createFirst')"
    >
      <template #icon><ListTodo class="h-5 w-5" /></template>
      <template #action>
        <Button @click="openCreate">
          <Plus class="h-4 w-4" />
          Add task
        </Button>
      </template>
    </EmptyState>

    <ul v-else-if="viewMode === 'list'" class="space-y-2">
      <TaskListItem
        v-for="task in tasksStore.items"
        :key="task.id"
        :task="task"
        :category="task.categoryId ? categoryById[task.categoryId] : null"
        @edit="openEdit(task)"
        @delete="askDelete(task)"
        @toggle-complete="toggleComplete(task)"
        @set-progress="(value) => setProgress(task, value)"
      />
    </ul>

    <div v-else class="grid gap-3 md:grid-cols-3">
      <div
        v-for="col in boardColumns"
        :key="col.value"
        class="rounded-lg border bg-muted/30 p-3"
        @dragover.prevent
        @drop="onDrop($event, col.value)"
      >
        <h3 class="mb-2 flex items-center justify-between text-sm font-semibold">
          <span>{{ col.label }}</span>
          <span class="text-xs text-muted-foreground">{{ tasksByStatus(col.value).length }}</span>
        </h3>
        <div class="space-y-2">
          <div
            v-for="task in tasksByStatus(col.value)"
            :key="task.id"
            class="cursor-move rounded-md border bg-card p-2.5 text-sm shadow-sm"
            draggable="true"
            @dragstart="onDragStart($event, task.id)"
          >
            <p class="font-medium">{{ task.title }}</p>
            <div class="mt-1 flex flex-wrap items-center gap-1.5">
              <TaskPriorityBadge :priority="task.priority" />
              <TaskPlanBadge :plan="task.plan" />
            </div>
            <div class="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>{{ task.progress ?? 0 }}%</span>
              <span v-if="task.deadline">{{ new Date(task.deadline).toLocaleDateString() }}</span>
            </div>
          </div>
          <p v-if="!tasksByStatus(col.value).length" class="py-4 text-center text-xs text-muted-foreground">
            Drop tasks here
          </p>
        </div>
      </div>
    </div>

    <ResourceFormDialog
      v-model:open="dialogOpen"
      :title="editing ? t('tasks.editTask') : t('tasks.newTask')"
      :description="editing ? t('tasks.updateTask') : t('tasks.addTaskDesc')"
      :fields="fields"
      :schema="taskSchema"
      :initial="editing"
      :submit-label="editing ? t('tasks.saveChanges') : t('tasks.createTask')"
      @submit="submit"
    />

    <ConfirmDeleteDialog
      v-model:open="deleteOpen"
      :title="t('tasks.deleteTask')"
      :description="t('tasks.deleteConfirm', { title: deleting?.title ?? '' })"
      :loading="deleteLoading"
      @confirm="confirmDelete"
    />
  </div>
</template>
