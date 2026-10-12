<script setup>
import { computed, onMounted, ref } from 'vue'
import { Plus, Search, Pencil, Trash2, Check, ListTodo } from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ResourceFormDialog from '@/components/forms/ResourceFormDialog.vue'
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog.vue'
import TaskPriorityBadge from '@/components/tasks/TaskPriorityBadge.vue'
import TaskStatusBadge from '@/components/tasks/TaskStatusBadge.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Select from '@/components/ui/Select.vue'
import { cn } from '@/lib/utils'
import { formatDue } from '@/lib/format'
import { PRIORITIES, TASK_STATUSES, priorityMeta, statusMeta } from '@/lib/constants'
import { taskSchema } from '@/schemas'
import { useTasksStore } from '@/stores/tasks'
import { useCategoriesStore } from '@/stores/categories'
import { useProjectsStore } from '@/stores/projects'
import { useToast } from '@/composables/useToast'

const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()
const projectsStore = useProjectsStore()
const toast = useToast()

const search = ref('')
const statusFilter = ref('')
const priorityFilter = ref('')
const sortBy = ref('due')

const dialogOpen = ref(false)
const editing = ref(null)
const deleteOpen = ref(false)
const deleting = ref(null)
const deleteLoading = ref(false)

onMounted(async () => {
  await Promise.all([tasksStore.load(), categoriesStore.load(), projectsStore.load()])
})

const categoryOptions = computed(() => [
  { label: '— None —', value: '' },
  ...categoriesStore.items.map((c) => ({ label: c.name, value: c.id })),
])
const projectOptions = computed(() => [
  { label: '— None —', value: '' },
  ...projectsStore.items.map((p) => ({ label: p.name, value: p.id })),
])

const statusOptions = TASK_STATUSES.map((s) => ({ label: statusMeta[s].label, value: s }))
const priorityOptions = PRIORITIES.map((p) => ({ label: priorityMeta[p].label, value: p }))

const fields = computed(() => [
  { name: 'title', label: 'Title', type: 'text', required: true, span: 2, placeholder: 'e.g. Draft project proposal' },
  { name: 'description', label: 'Description', type: 'textarea', span: 2, rows: 3, placeholder: 'Optional details' },
  { name: 'status', label: 'Status', type: 'select', options: statusOptions },
  { name: 'priority', label: 'Priority', type: 'select', options: priorityOptions },
  { name: 'categoryId', label: 'Category', type: 'select', options: categoryOptions.value },
  { name: 'projectId', label: 'Project', type: 'select', options: projectOptions.value },
  { name: 'dueDate', label: 'Due date', type: 'datetime' },
  { name: 'estimatedMinutes', label: 'Estimated minutes', type: 'number', min: 0, placeholder: 'e.g. 30' },
])

const categoryById = computed(() => {
  const map = {}
  for (const c of categoriesStore.items) map[c.id] = c
  return map
})
const projectById = computed(() => {
  const map = {}
  for (const p of projectsStore.items) map[p.id] = p
  return map
})

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 }

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  let list = tasksStore.items.filter((t) => {
    if (statusFilter.value && t.status !== statusFilter.value) return false
    if (priorityFilter.value && t.priority !== priorityFilter.value) return false
    if (term && !t.title.toLowerCase().includes(term)) return false
    return true
  })
  list = [...list]
  if (sortBy.value === 'due') {
    list.sort((a, b) => (a.dueDate ? new Date(a.dueDate) : Infinity) - (b.dueDate ? new Date(b.dueDate) : Infinity))
  } else if (sortBy.value === 'priority') {
    list.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  } else if (sortBy.value === 'created') {
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  } else if (sortBy.value === 'title') {
    list.sort((a, b) => a.title.localeCompare(b.title))
  }
  return list
})

const remaining = computed(() => tasksStore.items.filter((t) => t.status !== 'completed').length)

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

async function submit(values) {
  try {
    if (editing.value) {
      await tasksStore.update(editing.value.id, values)
      toast.success('Task updated')
    } else {
      await tasksStore.create(values)
      toast.success('Task created')
    }
  } catch (err) {
    toast.error('Could not save task', err?.message)
    throw err
  }
}

async function confirmDelete() {
  deleteLoading.value = true
  try {
    await tasksStore.remove(deleting.value.id)
    toast.success('Task deleted')
    deleteOpen.value = false
  } catch (err) {
    toast.error('Could not delete task', err?.message)
  } finally {
    deleteLoading.value = false
  }
}

async function toggleComplete(task) {
  const next = task.status === 'completed' ? 'todo' : 'completed'
  try {
    await tasksStore.update(task.id, { status: next })
  } catch (err) {
    toast.error('Could not update task', err?.message)
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="My Tasks" description="Create, organize and complete your tasks.">
      <template #actions>
        <Button @click="openCreate">
          <Plus class="h-4 w-4" />
          Add task
        </Button>
      </template>
    </PageHeader>

    <Card>
      <CardContent class="flex flex-col gap-3 pt-6 lg:flex-row lg:items-center">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input v-model="search" placeholder="Search tasks..." class="pl-9" />
        </div>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-auto lg:grid-cols-3">
          <Select v-model="statusFilter">
            <option value="">All statuses</option>
            <option v-for="s in TASK_STATUSES" :key="s" :value="s">{{ statusMeta[s].label }}</option>
          </Select>
          <Select v-model="priorityFilter">
            <option value="">All priorities</option>
            <option v-for="p in PRIORITIES" :key="p" :value="p">{{ priorityMeta[p].label }}</option>
          </Select>
          <Select v-model="sortBy">
            <option value="due">Due date</option>
            <option value="priority">Priority</option>
            <option value="created">Newest</option>
            <option value="title">Title</option>
          </Select>
        </div>
      </CardContent>
    </Card>

    <div class="flex items-center justify-between text-sm text-muted-foreground">
      <span>{{ filtered.length }} shown · {{ remaining }} open</span>
    </div>

    <LoadingState v-if="tasksStore.loading && !tasksStore.loaded" />

    <EmptyState
      v-else-if="!filtered.length"
      title="No tasks found"
      description="Create your first task or adjust the filters above."
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
      <li
        v-for="task in filtered"
        :key="task.id"
        class="group flex items-start gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40"
      >
        <button
          type="button"
          :class="
            cn(
              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
              task.status === 'completed'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted-foreground/40 hover:border-primary',
            )
          "
          :aria-label="task.status === 'completed' ? 'Mark as to do' : 'Mark complete'"
          @click="toggleComplete(task)"
        >
          <Check v-if="task.status === 'completed'" class="h-3 w-3" />
        </button>

        <div class="min-w-0 flex-1">
          <p
            :class="
              cn(
                'truncate text-sm font-medium',
                task.status === 'completed' && 'text-muted-foreground line-through',
              )
            "
          >
            {{ task.title }}
          </p>
          <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{{ formatDue(task.dueDate) }}</span>
            <span v-if="categoryById[task.categoryId]" class="inline-flex items-center gap-1">
              <span
                class="h-2 w-2 rounded-full"
                :style="{ backgroundColor: categoryById[task.categoryId].color }"
              />
              {{ categoryById[task.categoryId].name }}
            </span>
            <span v-if="projectById[task.projectId]">· {{ projectById[task.projectId].name }}</span>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <TaskPriorityBadge :priority="task.priority" />
          <TaskStatusBadge :status="task.status" class="hidden sm:inline-flex" />
          <div class="flex opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="icon" aria-label="Edit task" @click="openEdit(task)">
              <Pencil class="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Delete task" @click="askDelete(task)">
              <Trash2 class="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </li>
    </ul>

    <ResourceFormDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit task' : 'New task'"
      :description="editing ? 'Update the details of this task.' : 'Add a task to keep your day on track.'"
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
