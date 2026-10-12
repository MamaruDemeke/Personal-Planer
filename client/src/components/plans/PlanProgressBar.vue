<script setup>
import { computed } from 'vue'
import { Progress } from '@/components/ui/progress'
import { deadlineLabel } from '@/lib/planProgress'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Renders a plan's progress: a colored bar plus completed/remaining counts and
 * a deadline indicator. The bar turns green when complete and red when overdue.
 */
const props = defineProps({
  progress: { type: Object, required: true },
  plan: { type: Object, default: null },
  accent: { type: String, default: 'var(--color-primary)' },
  class: { type: null, default: '' },
})

const indicatorStyle = computed(() => {
  if (props.progress.isCompleted) return { backgroundColor: 'var(--color-success)' }
  if (props.progress.isOverdue) return { backgroundColor: 'var(--color-destructive)' }
  return { backgroundColor: props.accent }
})

const deadlineText = computed(() => deadlineLabel(props.progress, props.plan, formatDate))
</script>

<template>
  <div :class="cn('space-y-1.5', props.class)">
    <div class="flex items-center justify-between text-xs">
      <span class="font-medium text-foreground">{{ progress.percent }}%</span>
      <span class="text-muted-foreground">
        {{ progress.completed }}/{{ progress.total }} done · {{ progress.remaining }} remaining
      </span>
    </div>

    <Progress
      :model-value="progress.percent"
      class="h-2.5"
      :indicator-style="indicatorStyle"
    />

    <div class="flex items-center justify-between text-xs">
      <span
        :class="
          cn(
            'inline-flex items-center gap-1',
            progress.isOverdue
              ? 'font-medium text-destructive'
              : progress.isCompleted
                ? 'text-success'
                : 'text-muted-foreground',
          )
        "
      >
        {{ deadlineText }}
      </span>
      <span v-if="progress.usingFinal" class="text-muted-foreground">Final result</span>
    </div>
  </div>
</template>
