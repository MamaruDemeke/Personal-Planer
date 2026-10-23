<script setup>
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: null, default: '' },
  accent: { type: String, default: 'auto' },
})

const accentStyle = computed(() => {
  if (!props.accent || props.accent === 'none') return {}
  const base = props.accent === 'auto' ? 'var(--page-accent, var(--primary))' : props.accent
  return {
    borderTopWidth: '3px',
    borderTopColor: `color-mix(in oklab, ${base} 70%, transparent)`,
  }
})
</script>

<template>
  <div
    :class="cn('rounded-lg border bg-card text-card-foreground shadow-sm', props.class)"
    :style="accentStyle"
  >
    <slot />
  </div>
</template>
