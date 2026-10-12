<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  addHours,
} from 'date-fns'
import { Plus, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ResourceFormDialog from '@/components/forms/ResourceFormDialog.vue'
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/format'
import { eventSchema } from '@/schemas'
import { useEventsStore } from '@/stores/events'
import { useProjectsStore } from '@/stores/projects'
import { useToast } from '@/composables/useToast'

const eventsStore = useEventsStore()
const projectsStore = useProjectsStore()
const toast = useToast()

const cursor = ref(startOfMonth(new Date()))
const dialogOpen = ref(false)
const editing = ref(null)
const prefill = ref(null)
const deleteOpen = ref(false)
const deleting = ref(null)
const deleteLoading = ref(false)
const selected = ref(null)

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

onMounted(async () => {
  await Promise.all([eventsStore.load(), projectsStore.load()])
})

const fields = computed(() => [
  { name: 'title', label: 'Title', type: 'text', required: true, span: 2, placeholder: 'e.g. Design review' },
  { name: 'description', label: 'Description', type: 'textarea', span: 2, rows: 2, placeholder: 'Optional' },
  { name: 'startTime', label: 'Starts', type: 'datetime' },
  { name: 'endTime', label: 'Ends', type: 'datetime' },
  {
    name: 'projectId',
    label: 'Project',
    type: 'select',
    options: [
      { label: '— None —', value: '' },
      ...projectsStore.items.map((p) => ({ label: p.name, value: p.id })),
    ],
  },
  { name: 'allDay', label: 'All day', type: 'checkbox' },
])

const days = computed(() => {
  const start = startOfWeek(startOfMonth(cursor.value))
  const end = endOfWeek(endOfMonth(cursor.value))
  return eachDayOfInterval({ start, end })
})

const monthLabel = computed(() => format(cursor.value, 'MMMM yyyy'))

function eventsFor(day) {
  return eventsStore.items
    .filter((e) => isSameDay(new Date(e.startTime), day))
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
}

function openCreate(day) {
  editing.value = null
  const base = day ? startOfDay(day) : new Date()
  const start = addHours(base, 9)
  prefill.value = { startTime: start.toISOString(), endTime: addHours(start, 1).toISOString() }
  dialogOpen.value = true
}
function openEdit(event) {
  editing.value = event
  prefill.value = null
  dialogOpen.value = true
}
function askDelete(event) {
  editing.value = event
  deleteOpen.value = true
}

async function submit(values) {
  if (new Date(values.endTime) < new Date(values.startTime)) {
    toast.error('The end time must be after the start time.')
    throw new Error('Invalid time range')
  }
  try {
    if (editing.value) {
      await eventsStore.update(editing.value.id, values)
      toast.success('Event updated')
    } else {
      await eventsStore.create(values)
      toast.success('Event created')
    }
  } catch (err) {
    toast.error('Could not save event', err?.message)
    throw err
  }
}

async function confirmDelete() {
  deleteLoading.value = true
  try {
    await eventsStore.remove(editing.value.id)
    toast.success('Event deleted')
    deleteOpen.value = false
  } catch (err) {
    toast.error('Could not delete event', err?.message)
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <PageHeader title="Calendar" description="Plan your month and see upcoming events.">
      <template #actions>
        <Button @click="openCreate(null)">
          <Plus class="h-4 w-4" />
          Add event
        </Button>
      </template>
    </PageHeader>

    <Card>
      <CardContent class="space-y-4 pt-6">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">{{ monthLabel }}</h2>
          <div class="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" aria-label="Previous month" @click="cursor = subMonths(cursor, 1)">
              <ChevronLeft class="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" @click="cursor = startOfMonth(new Date())">Today</Button>
            <Button variant="outline" size="icon-sm" aria-label="Next month" @click="cursor = addMonths(cursor, 1)">
              <ChevronRight class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <LoadingState v-if="eventsStore.loading && !eventsStore.loaded" :rows="5" />

        <div v-else class="overflow-hidden rounded-lg border">
          <div class="grid grid-cols-7 border-b bg-muted/40">
            <div
              v-for="d in weekdays"
              :key="d"
              class="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {{ d }}
            </div>
          </div>
          <div class="grid grid-cols-7">
            <div
              v-for="day in days"
              :key="day.toISOString()"
              :class="
                cn(
                  'min-h-[88px] border-b border-r p-1 last:border-r-0',
                  !isSameMonth(day, cursor) && 'bg-muted/20',
                )
              "
            >
              <div class="mb-1 flex items-center justify-between">
                <button
                  type="button"
                  :class="
                    cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                      isSameDay(day, new Date()) && 'bg-primary text-primary-foreground',
                      !isSameMonth(day, cursor) && 'text-muted-foreground',
                    )
                  "
                  @click="openCreate(day)"
                >
                  {{ format(day, 'd') }}
                </button>
              </div>
              <div class="space-y-1">
                <button
                  v-for="event in eventsFor(day).slice(0, 3)"
                  :key="event.id"
                  type="button"
                  class="block w-full truncate rounded bg-primary/10 px-1.5 py-0.5 text-left text-xs text-primary hover:bg-primary/20"
                  @click="openEdit(event)"
                >
                  {{ event.allDay ? '' : formatTime(event.startTime) + ' ' }}{{ event.title }}
                </button>
                <span
                  v-if="eventsFor(day).length > 3"
                  class="block px-1.5 text-xs text-muted-foreground"
                >
                  +{{ eventsFor(day).length - 3 }} more
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <div v-if="eventsStore.items.length === 0" class="flex items-center justify-center gap-2 text-sm text-muted-foreground">
      <CalendarDays class="h-4 w-4" />
      No events yet — click a day to add one.
    </div>

    <ResourceFormDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit event' : 'New event'"
      :fields="fields"
      :schema="eventSchema"
      :initial="editing || prefill"
      :submit-label="editing ? 'Save changes' : 'Create event'"
      @submit="submit"
    />

    <ConfirmDeleteDialog
      v-model:open="deleteOpen"
      title="Delete event"
      :description="`Delete “${editing?.title ?? ''}”?`"
      :loading="deleteLoading"
      @confirm="confirmDelete"
    />
  </div>
</template>
