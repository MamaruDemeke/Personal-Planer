<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({
  title: { type: String, default: 'Nothing here yet' },
  description: { type: String, default: '' },
  class: { type: null, default: '' },
})

const accent = 'var(--page-accent, var(--primary))'
</script>

<template>
  <div
    :class="
      cn(
        'flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed px-4 py-6 text-center sm:gap-3 sm:px-6 sm:py-8',
        props.class,
      )
    "
    :style="{
      borderColor: `color-mix(in oklab, ${accent} 35%, transparent)`,
      backgroundColor: `color-mix(in oklab, ${accent} 5%, var(--card))`,
    }"
  >
    <div
      class="flex h-9 w-9 items-center justify-center rounded-full"
      :style="{
        backgroundColor: `color-mix(in oklab, ${accent} 15%, transparent)`,
        color: accent,
      }"
    >
      <slot name="icon" />
    </div>
    <div class="space-y-0.5">
      <h3 class="text-sm font-semibold">{{ title }}</h3>
      <p v-if="description" class="mx-auto max-w-sm text-xs text-muted-foreground">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.action" class="pt-0.5">
      <slot name="action" />
    </div>
  </div>
</template>
