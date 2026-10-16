<script setup>
import { computed } from 'vue'
import { CalendarClock, Check, Pencil, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import Progress from '@/components/ui/progress/Progress.vue'
import TaskStatusBadge from './TaskStatusBadge.vue'
import TaskPriorityBadge from './TaskPriorityBadge.vue'
import TaskPlanBadge from './TaskPlanBadge.vue'
import { cn } from '@/lib/utils'
import { formatDue, formatRange } from '@/lib/format'

const props = defineProps({
  task: { type: Object, required: true },
  category: { type: Object, default: null },
})

defineEmits(['edit', 'delete', 'toggle-complete', 'set-progress'])

const completed = computed(() => props.task.isCompleted ?? props.task.status === 'completed')
const progress = computed(() => props.task.progress ?? 0)

const progressColor = computed(() => {
  if (progress.value >= 100) return '#22c55e'
  if (props.task.overdue) return '#ef4444'
  if (progress.value <= 0) return 'var(--muted-foreground)'
  return '#0d9488'
})
</script>

<template>
  <li class="rounded-lg border bg-card p-3 transition-colors hover:border-primary/40">
    <div class="flex items-start gap-3">
      <button
        type="button"
        :class="
          cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
            completed
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/40 hover:border-primary',
          )
        "
        :aria-label="completed ? 'Mark as not done' : 'Mark complete'"
        @click="$emit('toggle-complete')"
      >
        <Check v-if="completed" class="h-3 w-3" />
      </button>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <p
            :class="
              cn('text-sm font-medium', completed && 'text-muted-foreground line-through')
            "
          >
            {{ task.title }}
          </p>
          <TaskPriorityBadge :priority="task.priority" />
          <TaskStatusBadge :task="task" />
          <TaskPlanBadge :plan="task.plan" />
        </div>

        <p v-if="task.description" class="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {{ task.description }}
        </p>

        <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span v-if="category" class="inline-flex items-center gap-1">
            <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: category.color }" />
            {{ category.name }}
          </span>
          <span class="inline-flex items-center gap-1">
            <CalendarClock class="h-3 w-3" />
            {{ formatRange(task.startDate, task.deadline) }}
          </span>
          <span v-if="task.overdue" class="text-destructive">
            Overdue · {{ formatDue(task.deadline) }}
          </span>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Edit task" @click="$emit('edit')">
          <Pencil class="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Delete task" @click="$emit('delete')">
          <Trash2 class="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>

    <div class="mt-2.5 flex items-center gap-3 pl-8">
      <Progress
        :model-value="progress"
        class="flex-1"
        :indicator-style="{ backgroundColor: progressColor }"
      />
      <span class="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
        {{ progress }}%
      </span>
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        :value="progress"
        class="h-1.5 w-20 shrink-0 cursor-pointer sm:w-32"
        style="accent-color: var(--primary)"
        :aria-label="`Progress for ${task.title}`"
        @change="$emit('set-progress', Number($event.target.value))"
      />
    </div>
  </li>
</template>
