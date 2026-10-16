<script setup>
import { computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import Progress from '@/components/ui/progress/Progress.vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, default: '' },
  icon: { type: [Object, Function], default: null },
  tone: { type: String, default: 'primary' },
  progress: { type: Number, default: null },
})

const TONES = {
  primary: { chip: 'bg-primary/10 text-primary', bar: '#0d9488' },
  success: { chip: 'bg-success/10 text-success', bar: '#22c55e' },
  warning: { chip: 'bg-warning/15 text-warning-foreground', bar: '#f59e0b' },
  destructive: { chip: 'bg-destructive/10 text-destructive', bar: '#ef4444' },
  info: { chip: 'bg-info/10 text-info', bar: '#3b82f6' },
  purple: { chip: 'bg-purple/10 text-purple', bar: '#8b5cf6' },
}

const tone = computed(() => TONES[props.tone] ?? TONES.primary)
</script>

<template>
  <Card class="card-hover border-l-4" :style="{ borderLeftColor: tone.bar }">
    <CardContent class="p-4 sm:p-5">
      <div class="flex items-center gap-4">
        <span
          v-if="icon"
          :class="cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-md', tone.chip)"
        >
          <component :is="icon" class="h-6 w-6" />
        </span>
        <div class="min-w-0 flex-1 space-y-1">
          <p class="text-[14px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[15px]">
            {{ label }}
          </p>
          <div class="flex items-baseline gap-2">
            <p class="text-2xl font-semibold leading-none tabular-nums sm:text-3xl">{{ value }}</p>
            <p v-if="hint" class="text-[13px] text-muted-foreground sm:text-[14px]">{{ hint }}</p>
          </div>
        </div>
      </div>
      <Progress
        v-if="progress !== null"
        class="mt-3 h-2"
        :model-value="progress"
        :indicator-style="{ backgroundColor: tone.bar }"
      />
    </CardContent>
  </Card>
</template>
