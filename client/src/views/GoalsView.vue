<script setup>
import { computed, onMounted, ref } from 'vue'
import { Plus, Pencil, Trash2, Target, ChevronDown, Check, X } from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ResourceFormDialog from '@/components/forms/ResourceFormDialog.vue'
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import { GOAL_STATUSES, goalStatusMeta } from '@/lib/constants'
import { goalSchema } from '@/schemas'
import { useGoalsStore } from '@/stores/goals'
import { useMilestonesStore } from '@/stores/milestones'
import { useToast } from '@/composables/useToast'

const goalsStore = useGoalsStore()
const milestonesStore = useMilestonesStore()
const toast = useToast()

const dialogOpen = ref(false)
const editing = ref(null)
const deleteOpen = ref(false)
const deleting = ref(null)
const deleteLoading = ref(false)
const expanded = ref(null)
const newMilestone = ref('')
const addingMilestone = ref(false)

onMounted(async () => {
  await Promise.all([goalsStore.load(), milestonesStore.load()])
})

const fields = [
  { name: 'title', label: 'Title', type: 'text', required: true, span: 2, placeholder: 'e.g. Run a half marathon' },
  { name: 'description', label: 'Description', type: 'textarea', span: 2, rows: 2, placeholder: 'Optional' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: GOAL_STATUSES.map((s) => ({ label: goalStatusMeta[s].label, value: s })),
  },
  { name: 'targetDate', label: 'Target date', type: 'date' },
  { name: 'progress', label: 'Progress (%)', type: 'number', min: 0, max: 100, default: 0 },
  { name: 'currentValue', label: 'Current value', type: 'number', min: 0, default: 0 },
  { name: 'targetValue', label: 'Target value', type: 'number', min: 0, placeholder: 'Optional' },
]

function milestonesFor(goalId) {
  return milestonesStore.items
    .filter((m) => m.goalId === goalId)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

function toggleExpanded(goalId) {
  expanded.value = expanded.value === goalId ? null : goalId
}

function openCreate() {
  editing.value = null
  dialogOpen.value = true
}
function openEdit(goal) {
  editing.value = goal
  dialogOpen.value = true
}
function askDelete(goal) {
  deleting.value = goal
  deleteOpen.value = true
}

async function submit(values) {
  try {
    if (editing.value) {
      await goalsStore.update(editing.value.id, values)
      toast.success('Goal updated')
    } else {
      await goalsStore.create(values)
      toast.success('Goal created')
    }
  } catch (err) {
    toast.error('Could not save goal', err?.message)
    throw err
  }
}

async function confirmDelete() {
  deleteLoading.value = true
  try {
    await goalsStore.remove(deleting.value.id)
    toast.success('Goal deleted')
    deleteOpen.value = false
  } catch (err) {
    toast.error('Could not delete goal', err?.message)
  } finally {
    deleteLoading.value = false
  }
}

async function addMilestone(goal) {
  const title = newMilestone.value.trim()
  if (!title) return
  addingMilestone.value = true
  try {
    const count = milestonesFor(goal.id).length
    await milestonesStore.create({ title, goalId: goal.id, completed: false, sortOrder: count, dueDate: null })
    newMilestone.value = ''
  } catch (err) {
    toast.error('Could not add milestone', err?.message)
  } finally {
    addingMilestone.value = false
  }
}

async function toggleMilestone(milestone) {
  try {
    await milestonesStore.update(milestone.id, { completed: !milestone.completed })
  } catch (err) {
    toast.error('Could not update milestone', err?.message)
  }
}

async function removeMilestone(milestone) {
  try {
    await milestonesStore.remove(milestone.id)
  } catch (err) {
    toast.error('Could not remove milestone', err?.message)
  }
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <PageHeader title="Goals" description="Set measurable goals and break them into milestones.">
      <template #actions>
        <Button @click="openCreate">
          <Plus class="h-4 w-4" />
          Add goal
        </Button>
      </template>
    </PageHeader>

    <LoadingState v-if="goalsStore.loading && !goalsStore.loaded" :rows="3" />

    <EmptyState
      v-else-if="!goalsStore.items.length"
      title="No goals yet"
      description="Define a goal to start tracking your progress."
    >
      <template #icon><Target class="h-5 w-5" /></template>
      <template #action>
        <Button @click="openCreate"><Plus class="h-4 w-4" /> Add goal</Button>
      </template>
    </EmptyState>

    <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Card v-for="goal in goalsStore.items" :key="goal.id" class="group">
        <CardHeader class="flex-row items-start justify-between space-y-0">
          <div class="space-y-1">
            <CardTitle class="flex items-center gap-2">
              {{ goal.title }}
              <Badge :variant="goalStatusMeta[goal.status]?.variant || 'muted'">
                {{ goalStatusMeta[goal.status]?.label || goal.status }}
              </Badge>
            </CardTitle>
            <p v-if="goal.description" class="line-clamp-2 text-xs text-muted-foreground">{{ goal.description }}</p>
          </div>
          <div class="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="icon" aria-label="Edit goal" @click="openEdit(goal)">
              <Pencil class="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Delete goal" @click="askDelete(goal)">
              <Trash2 class="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardHeader>
        <CardContent class="space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="text-muted-foreground">
              <template v-if="goal.targetValue != null">
                {{ goal.currentValue }} / {{ goal.targetValue }}
              </template>
              <template v-else>Progress</template>
            </span>
            <span class="font-medium">{{ goal.progress }}%</span>
          </div>
          <Progress :model-value="goal.progress" />
          <div class="flex items-center justify-between">
            <span v-if="goal.targetDate" class="text-xs text-muted-foreground">
              Target {{ formatDate(goal.targetDate) }}
            </span>
            <Button variant="ghost" size="sm" @click="toggleExpanded(goal.id)">
              Milestones ({{ milestonesFor(goal.id).length }})
              <ChevronDown :class="cn('h-4 w-4 transition-transform', expanded === goal.id && 'rotate-180')" />
            </Button>
          </div>

          <div v-if="expanded === goal.id" class="space-y-1.5 rounded-lg border bg-muted/30 p-2.5">
            <ul v-if="milestonesFor(goal.id).length" class="space-y-1">
              <li
                v-for="milestone in milestonesFor(goal.id)"
                :key="milestone.id"
                class="flex items-center gap-2 text-sm"
              >
                <button
                  type="button"
                  :class="
                    cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                      milestone.completed
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/40',
                    )
                  "
                  :aria-label="milestone.completed ? 'Mark incomplete' : 'Mark complete'"
                  @click="toggleMilestone(milestone)"
                >
                  <Check v-if="milestone.completed" class="h-2.5 w-2.5" />
                </button>
                <span :class="cn('flex-1', milestone.completed && 'text-muted-foreground line-through')">
                  {{ milestone.title }}
                </span>
                <button
                  type="button"
                  class="text-muted-foreground hover:text-destructive"
                  aria-label="Remove milestone"
                  @click="removeMilestone(milestone)"
                >
                  <X class="h-3.5 w-3.5" />
                </button>
              </li>
            </ul>
            <p v-else class="text-xs text-muted-foreground">No milestones yet.</p>
            <form class="flex gap-2" @submit.prevent="addMilestone(goal)">
              <Input v-model="newMilestone" placeholder="Add a milestone..." class="h-8" />
              <Button type="submit" size="sm" :disabled="addingMilestone">
                <Plus class="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>

    <ResourceFormDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit goal' : 'New goal'"
      :fields="fields"
      :schema="goalSchema"
      :initial="editing"
      :submit-label="editing ? 'Save changes' : 'Create goal'"
      @submit="submit"
    />

    <ConfirmDeleteDialog
      v-model:open="deleteOpen"
      title="Delete goal"
      :description="`Delete “${deleting?.title ?? ''}”? Its milestones will be removed too.`"
      :loading="deleteLoading"
      @confirm="confirmDelete"
    />
  </div>
</template>
