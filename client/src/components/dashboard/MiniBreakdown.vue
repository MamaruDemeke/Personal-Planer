<script setup>
import { computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const props = defineProps({
  label: { type: String, required: true },
  icon: { type: [Object, Function], default: null },
  tone: { type: String, default: 'primary' },
  segments: { type: Array, default: () => [] },
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
const total = computed(() => props.segments.reduce((sum, seg) => sum + (seg.value || 0), 0))

function width(value) {
  if (!total.value) return '0%'
  return `${Math.round(((value || 0) / total.value) * 100)}%`
}
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
        <p class="text-[14px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[15px]">
          {{ label }}
        </p>
      </div>

      <div class="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-muted">
        <span
          v-for="seg in segments"
          :key="seg.label"
          :style="{ width: width(seg.value), backgroundColor: seg.color }"
        />
      </div>

      <div class="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span
          v-for="seg in segments"
          :key="seg.label"
          class="flex items-center gap-2 text-[13px] text-muted-foreground sm:text-[14px]"
        >
          <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: seg.color }" />
          {{ seg.label }}
          <span class="font-semibold text-foreground">{{ seg.value }}</span>
        </span>
      </div>
    </CardContent>
  </Card>
</template>
