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

const toneStyles = {
  primary: { chip: 'from-primary/25 to-primary/5 text-primary', bar: 'from-primary to-info' },
  success: { chip: 'from-success/25 to-success/5 text-success', bar: 'from-success to-info' },
  warning: {
    chip: 'from-warning/30 to-warning/5 text-warning-foreground',
    bar: 'from-warning to-pink',
  },
  destructive: {
    chip: 'from-destructive/25 to-destructive/5 text-destructive',
    bar: 'from-destructive to-pink',
  },
  info: { chip: 'from-info/25 to-info/5 text-info', bar: 'from-info to-purple' },
  purple: { chip: 'from-purple/25 to-purple/5 text-purple', bar: 'from-purple to-pink' },
  muted: {
    chip: 'from-muted to-muted/40 text-muted-foreground',
    bar: 'from-muted-foreground/40 to-muted-foreground/10',
  },
}

const style = computed(() => toneStyles[props.tone] ?? toneStyles.primary)
const trendPositive = computed(() => (props.trend ?? 0) >= 0)
</script>

<template>
  <Card class="card-hover relative overflow-hidden p-3.5 sm:p-4">
    <span class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r" :class="style.bar" aria-hidden="true" />
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 space-y-1">
        <p class="truncate text-xs font-medium text-muted-foreground sm:text-sm">{{ title }}</p>
        <p class="text-2xl font-semibold tracking-tight tabular-nums">{{ value }}</p>
      </div>
      <div
        v-if="icon"
        :class="
          cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm',
            style.chip,
          )
        "
      >
        <component :is="icon" class="h-4.5 w-4.5" />
      </div>
    </div>
    <div class="mt-2 flex items-center gap-2 text-xs">
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
