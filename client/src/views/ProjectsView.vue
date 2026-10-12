<script setup>
import { computed, onMounted, ref } from 'vue'
import { Plus, Pencil, Trash2, FolderKanban, CalendarClock } from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ResourceFormDialog from '@/components/forms/ResourceFormDialog.vue'
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatDate } from '@/lib/format'
import { PROJECT_STATUSES, projectStatusMeta } from '@/lib/constants'
import { projectSchema } from '@/schemas'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'
import { useToast } from '@/composables/useToast'

const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()
const toast = useToast()

const dialogOpen = ref(false)
const editing = ref(null)
const deleteOpen = ref(false)
const deleting = ref(null)
const deleteLoading = ref(false)

onMounted(async () => {
  await Promise.all([projectsStore.load(), tasksStore.load()])
})

const fields = [
  { name: 'name', label: 'Name', type: 'text', required: true, span: 2, placeholder: 'e.g. Planora Launch' },
  { name: 'description', label: 'Description', type: 'textarea', span: 2, rows: 3, placeholder: 'What is this project about?' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: PROJECT_STATUSES.map((s) => ({ label: projectStatusMeta[s].label, value: s })),
  },
  { name: 'startDate', label: 'Start date', type: 'date' },
  { name: 'deadline', label: 'Deadline', type: 'date' },
]

const progress = computed(() =>
  projectsStore.items.map((project) => {
    const projectTasks = tasksStore.items.filter((t) => t.projectId === project.id)
    const done = projectTasks.filter((t) => t.status === 'completed').length
    const percent = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0
    return { project, total: projectTasks.length, done, percent }
  }),
)

function openCreate() {
  editing.value = null
  dialogOpen.value = true
}
function openEdit(project) {
  editing.value = project
  dialogOpen.value = true
}
function askDelete(project) {
  deleting.value = project
  deleteOpen.value = true
}

async function submit(values) {
  try {
    if (editing.value) {
      await projectsStore.update(editing.value.id, values)
      toast.success('Project updated')
    } else {
      await projectsStore.create(values)
      toast.success('Project created')
    }
  } catch (err) {
    toast.error('Could not save project', err?.message)
    throw err
  }
}

async function confirmDelete() {
  deleteLoading.value = true
  try {
    await projectsStore.remove(deleting.value.id)
    toast.success('Project deleted')
    deleteOpen.value = false
  } catch (err) {
    toast.error('Could not delete project', err?.message)
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Projects" description="Track multi-task efforts from start to finish.">
      <template #actions>
        <Button @click="openCreate">
          <Plus class="h-4 w-4" />
          Add project
        </Button>
      </template>
    </PageHeader>

    <LoadingState v-if="projectsStore.loading && !projectsStore.loaded" :rows="3" />

    <EmptyState
      v-else-if="!projectsStore.items.length"
      title="No projects yet"
      description="Create a project to group related tasks."
    >
      <template #icon><FolderKanban class="h-5 w-5" /></template>
      <template #action>
        <Button @click="openCreate"><Plus class="h-4 w-4" /> Add project</Button>
      </template>
    </EmptyState>

    <div v-else class="grid gap-4 lg:grid-cols-2">
      <Card v-for="row in progress" :key="row.project.id" class="group">
        <CardHeader class="flex-row items-start justify-between space-y-0">
          <div class="space-y-1">
            <CardTitle class="flex items-center gap-2">
              {{ row.project.name }}
              <Badge :variant="projectStatusMeta[row.project.status]?.variant || 'muted'">
                {{ projectStatusMeta[row.project.status]?.label || row.project.status }}
              </Badge>
            </CardTitle>
            <p v-if="row.project.description" class="text-sm text-muted-foreground">
              {{ row.project.description }}
            </p>
          </div>
          <div class="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="icon" aria-label="Edit project" @click="openEdit(row.project)">
              <Pencil class="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Delete project" @click="askDelete(row.project)">
              <Trash2 class="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">{{ row.done }} / {{ row.total }} tasks done</span>
            <span class="font-medium">{{ row.percent }}%</span>
          </div>
          <Progress :model-value="row.percent" />
          <div
            v-if="row.project.startDate || row.project.deadline"
            class="flex items-center gap-1 text-xs text-muted-foreground"
          >
            <CalendarClock class="h-3.5 w-3.5" />
            <span>{{ formatDate(row.project.startDate) || '—' }}</span>
            <span>→</span>
            <span>{{ formatDate(row.project.deadline) || '—' }}</span>
          </div>
        </CardContent>
      </Card>
    </div>

    <ResourceFormDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit project' : 'New project'"
      :fields="fields"
      :schema="projectSchema"
      :initial="editing"
      :submit-label="editing ? 'Save changes' : 'Create project'"
      @submit="submit"
    />

    <ConfirmDeleteDialog
      v-model:open="deleteOpen"
      title="Delete project"
      :description="`Delete “${deleting?.name ?? ''}”? Tasks will keep their data but lose this link.`"
      :loading="deleteLoading"
      @confirm="confirmDelete"
    />
  </div>
</template>
