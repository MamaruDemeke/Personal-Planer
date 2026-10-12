<script setup>
import { computed, onMounted, ref } from 'vue'
import { Plus, Pencil, Trash2, BellRing, Check } from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ResourceFormDialog from '@/components/forms/ResourceFormDialog.vue'
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Select from '@/components/ui/Select.vue'
import { cn } from '@/lib/utils'
import { formatDue, formatRelative } from '@/lib/format'
import { REMINDER_CHANNELS, REMINDER_STATUSES, reminderChannelMeta, reminderStatusMeta } from '@/lib/constants'
import { reminderSchema } from '@/schemas'
import { useRemindersStore } from '@/stores/reminders'
import { useTasksStore } from '@/stores/tasks'
import { useEventsStore } from '@/stores/events'
import { useToast } from '@/composables/useToast'

const remindersStore = useRemindersStore()
const tasksStore = useTasksStore()
const eventsStore = useEventsStore()
const toast = useToast()

const statusFilter = ref('')
const dialogOpen = ref(false)
const editing = ref(null)
const deleteOpen = ref(false)
const deleting = ref(null)
const deleteLoading = ref(false)

onMounted(async () => {
  await Promise.all([remindersStore.load(), tasksStore.load(), eventsStore.load()])
})

const fields = computed(() => [
  { name: 'message', label: 'Message', type: 'text', required: true, span: 2, placeholder: 'e.g. Review pull request #42' },
  { name: 'remindAt', label: 'Remind at', type: 'datetime', span: 2 },
  {
    name: 'channel',
    label: 'Channel',
    type: 'select',
    options: REMINDER_CHANNELS.map((c) => ({ label: reminderChannelMeta[c].label, value: c })),
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: REMINDER_STATUSES.map((s) => ({ label: reminderStatusMeta[s].label, value: s })),
  },
  {
    name: 'taskId',
    label: 'Attach to task',
    type: 'select',
    options: [
      { label: '— None —', value: '' },
      ...tasksStore.items.map((t) => ({ label: t.title, value: t.id })),
    ],
  },
  {
    name: 'eventId',
    label: 'Attach to event',
    type: 'select',
    options: [
      { label: '— None —', value: '' },
      ...eventsStore.items.map((e) => ({ label: e.title, value: e.id })),
    ],
  },
])

const filtered = computed(() =>
  remindersStore.items.filter((r) => !statusFilter.value || r.status === statusFilter.value),
)

const taskById = computed(() => {
  const map = {}
  for (const t of tasksStore.items) map[t.id] = t
  return map
})
const eventById = computed(() => {
  const map = {}
  for (const e of eventsStore.items) map[e.id] = e
  return map
})

function targetLabel(reminder) {
  if (reminder.taskId && taskById.value[reminder.taskId]) return taskById.value[reminder.taskId].title
  if (reminder.eventId && eventById.value[reminder.eventId]) return eventById.value[reminder.eventId].title
  return '—'
}

function openCreate() {
  editing.value = null
  dialogOpen.value = true
}
function openEdit(reminder) {
  editing.value = reminder
  dialogOpen.value = true
}
function askDelete(reminder) {
  deleting.value = reminder
  deleteOpen.value = true
}

async function submit(values) {
  if (values.taskId && values.eventId) {
    toast.error('Choose either a task or an event, not both.')
    throw new Error('Ambiguous reminder target')
  }
  if (!values.taskId && !values.eventId) {
    toast.error('Attach the reminder to a task or an event.')
    throw new Error('Missing reminder target')
  }
  try {
    if (editing.value) {
      await remindersStore.update(editing.value.id, values)
      toast.success('Reminder updated')
    } else {
      await remindersStore.create(values)
      toast.success('Reminder created')
    }
  } catch (err) {
    toast.error('Could not save reminder', err?.message)
    throw err
  }
}

async function confirmDelete() {
  deleteLoading.value = true
  try {
    await remindersStore.remove(deleting.value.id)
    toast.success('Reminder deleted')
    deleteOpen.value = false
  } catch (err) {
    toast.error('Could not delete reminder', err?.message)
  } finally {
    deleteLoading.value = false
  }
}

async function markSent(reminder) {
  try {
    await remindersStore.update(reminder.id, { status: 'sent' })
  } catch (err) {
    toast.error('Could not update reminder', err?.message)
  }
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <PageHeader title="Reminders" description="Never miss a deadline again.">
      <template #actions>
        <Button @click="openCreate">
          <Plus class="h-4 w-4" />
          Add reminder
        </Button>
      </template>
    </PageHeader>

    <div class="flex items-center gap-3">
      <Select v-model="statusFilter" class="sm:w-56">
        <option value="">All statuses</option>
        <option v-for="s in REMINDER_STATUSES" :key="s" :value="s">
          {{ reminderStatusMeta[s].label }}
        </option>
      </Select>
      <span class="text-sm text-muted-foreground">{{ filtered.length }} reminder(s)</span>
    </div>

    <LoadingState v-if="remindersStore.loading && !remindersStore.loaded" :rows="3" />

    <EmptyState
      v-else-if="!filtered.length"
      title="No reminders"
      description="Add a reminder to stay on top of your tasks and events."
    >
      <template #icon><BellRing class="h-5 w-5" /></template>
      <template #action>
        <Button @click="openCreate"><Plus class="h-4 w-4" /> Add reminder</Button>
      </template>
    </EmptyState>

    <ul v-else class="space-y-1.5">
      <li
        v-for="reminder in filtered"
        :key="reminder.id"
        class="group flex items-start gap-3 rounded-lg border bg-card p-2.5"
      >
        <span
          class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <BellRing class="h-4 w-4" />
        </span>
        <div class="min-w-0 flex-1">
          <p
            :class="
              cn(
                'truncate text-sm font-medium',
                reminder.status === 'sent' && 'text-muted-foreground line-through',
              )
            "
          >
            {{ reminder.message }}
          </p>
          <p class="text-xs text-muted-foreground">
            {{ formatDue(reminder.remindAt) }} · {{ targetLabel(reminder) }}
            <span v-if="reminder.sentAt"> · sent {{ formatRelative(reminder.sentAt) }}</span>
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <Badge variant="muted" class="hidden sm:inline-flex">
            {{ reminderChannelMeta[reminder.channel]?.label || reminder.channel }}
          </Badge>
          <Badge :variant="reminderStatusMeta[reminder.status]?.variant || 'muted'">
            {{ reminderStatusMeta[reminder.status]?.label || reminder.status }}
          </Badge>
          <div class="flex opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              v-if="reminder.status === 'pending'"
              variant="ghost"
              size="icon"
              aria-label="Mark sent"
              @click="markSent(reminder)"
            >
              <Check class="h-4 w-4 text-success" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Edit reminder" @click="openEdit(reminder)">
              <Pencil class="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Delete reminder" @click="askDelete(reminder)">
              <Trash2 class="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </li>
    </ul>

    <ResourceFormDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit reminder' : 'New reminder'"
      description="Attach the reminder to a task or an event."
      :fields="fields"
      :schema="reminderSchema"
      :initial="editing"
      :submit-label="editing ? 'Save changes' : 'Create reminder'"
      @submit="submit"
    />

    <ConfirmDeleteDialog
      v-model:open="deleteOpen"
      title="Delete reminder"
      :description="`Delete “${deleting?.message ?? ''}”?`"
      :loading="deleteLoading"
      @confirm="confirmDelete"
    />
  </div>
</template>
