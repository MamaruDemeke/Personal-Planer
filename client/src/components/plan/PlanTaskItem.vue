<script setup>
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'
import TaskStatusBadge from '@/components/tasks/TaskStatusBadge.vue'
import TaskPriorityBadge from '@/components/tasks/TaskPriorityBadge.vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  task: { type: Object, required: true },
  category: { type: Object, default: null },
  compact: { type: Boolean, default: false },
})

defineEmits(['toggle-complete'])

const completed = computed(() => props.task.isCompleted ?? props.task.status === 'completed')
</script>

<template>
  <div
    :class="
      cn(
        'flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-sm transition-all hover:-translate-y-px hover:border-primary/50 hover:shadow-sm hover:shadow-primary/10',
        completed && 'opacity-70',
      )
    "
  >
    <button
      type="button"
      :class="
        cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
          completed
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground/40 hover:border-primary',
        )
      "
      :aria-label="completed ? 'Mark as not done' : 'Mark complete'"
      @click="$emit('toggle-complete')"
    >
      <Check v-if="completed" class="h-2.5 w-2.5" />
    </button>

    <span
      v-if="category"
      class="h-2 w-2 shrink-0 rounded-full"
      :style="{ backgroundColor: category.color }"
      :title="category.name"
    />

    <span :class="cn('min-w-0 flex-1 truncate', completed && 'line-through')">
      {{ task.title }}
    </span>

    <template v-if="!compact">
      <TaskPriorityBadge :priority="task.priority" />
      <TaskStatusBadge :task="task" />
      <span class="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {{ task.progress ?? 0 }}%
      </span>
    </template>
  </div>
</template>
