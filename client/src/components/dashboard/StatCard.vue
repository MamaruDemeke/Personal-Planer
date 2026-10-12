<script setup>
import { computed } from 'vue'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], default: 0 },
  icon: { type: null, default: null },
  hint: { type: String, default: '' },
  trend: { type: Number, default: null },
  tone: { type: String, default: 'primary' },
})

const toneClasses = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning-foreground',
  destructive: 'bg-destructive/10 text-destructive',
  muted: 'bg-muted text-muted-foreground',
}

const iconClass = computed(() => toneClasses[props.tone] ?? toneClasses.primary)
const trendPositive = computed(() => (props.trend ?? 0) >= 0)
</script>

<template>
  <Card class="p-5">
    <div class="flex items-start justify-between gap-3">
      <div class="space-y-1">
        <p class="text-sm font-medium text-muted-foreground">{{ title }}</p>
        <p class="text-3xl font-semibold tracking-tight tabular-nums">{{ value }}</p>
      </div>
      <div
        v-if="icon"
        :class="cn('flex h-10 w-10 items-center justify-center rounded-lg', iconClass)"
      >
        <component :is="icon" class="h-5 w-5" />
      </div>
    </div>
    <div class="mt-3 flex items-center gap-2 text-xs">
      <span
        v-if="trend !== null"
        :class="
          cn(
            'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium',
            trendPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
          )
        "
      >
        {{ trendPositive ? '+' : '' }}{{ trend }}%
      </span>
      <span v-if="hint" class="text-muted-foreground">{{ hint }}</span>
    </div>
  </Card>
</template>
