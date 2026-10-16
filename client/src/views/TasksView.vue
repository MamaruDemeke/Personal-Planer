<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { ArrowDownUp, Calendar, CalendarClock, CalendarDays, CalendarRange, ListTodo, Plus, Search } from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ResourceFormDialog from '@/components/forms/ResourceFormDialog.vue'
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog.vue'
import TaskListItem from '@/components/tasks/TaskListItem.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Select from '@/components/ui/Select.vue'
import { taskSchema } from '@/schemas'
import { TASK_PRIORITIES, TASK_STATUSES, TASK_PLANS } from '@/lib/constants'
import { useTasksStore } from '@/stores/tasks'
import { useCategoriesStore } from '@/stores/categories'
import { useDashboardStore } from '@/stores/dashboard'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()
const dashboard = useDashboardStore()
const toast = useToast()

const search = ref(typeof route.query.search === 'string' ? route.query.search : '')
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
  { name: 'description', label: 'Description', type: 'textarea', span: 2, placeholder: 'What needs to be done?' },
  { name: 'notes', label: 'Notes', type: 'textarea', span: 2, placeholder: 'Extra notes' },
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
  editing.value = null
  dialogOpen.value = true
}

function openEdit(task) {
  editing.value = task
  dialogOpen.value = true
}

function askDelete(task) {
  deleting.value = task
  deleteOpen.value = true
}

function toggleOrder() {
  order.value = order.value === 'asc' ? 'desc' : 'asc'
}

async function submit(values) {
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
  const progress = Math.max(0, Math.min(100, Number(value) || 0))
  if (progress === (task.progress ?? 0)) return
  try {
    await tasksStore.update(task.id, { progress })
    dashboard.invalidate()
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
    <PageHeader title="My Tasks" description="Create, organise and track every task.">
      <template #actions>
        <Button @click="openCreate">
          <Plus class="h-4 w-4" />
          Add task
        </Button>
      </template>
    </PageHeader>

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
      title="Could not load tasks"
      :description="tasksStore.error"
      @retry="tasksStore.load(params, { force: true })"
    />

    <EmptyState
      v-else-if="!tasksStore.items.length"
      title="No tasks found"
      description="Create your first task to get started."
    >
      <template #icon><ListTodo class="h-5 w-5" /></template>
      <template #action>
        <Button @click="openCreate">
          <Plus class="h-4 w-4" />
          Add task
        </Button>
      </template>
    </EmptyState>

    <ul v-else class="space-y-2">
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

    <ResourceFormDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit task' : 'New task'"
      :description="editing ? 'Update this task.' : 'Add a task with a category, priority, dates and progress.'"
      :fields="fields"
      :schema="taskSchema"
      :initial="editing"
      :submit-label="editing ? 'Save changes' : 'Create task'"
      @submit="submit"
    />

    <ConfirmDeleteDialog
      v-model:open="deleteOpen"
      title="Delete task"
      :description="`Delete “${deleting?.title ?? ''}”? This cannot be undone.`"
      :loading="deleteLoading"
      @confirm="confirmDelete"
    />
  </div>
</template>
