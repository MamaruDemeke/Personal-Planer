<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  class: { type: null, default: '' },
})
</script>

<template>
  <div
    :class="cn('flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between', props.class)"
  >
    <div class="space-y-0.5">
      <h1 class="flex items-center gap-2 text-base font-semibold tracking-tight sm:text-lg">
        <span
          class="h-4 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-primary to-info sm:h-5"
          aria-hidden="true"
        />
        <span class="truncate">{{ title }}</span>
      </h1>
      <p v-if="description || $slots.description" class="text-xs text-muted-foreground">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-1.5">
      <slot name="actions" />
    </div>
  </div>
</template>
