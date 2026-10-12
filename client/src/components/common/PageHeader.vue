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
    :class="cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', props.class)"
  >
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold tracking-tight">{{ title }}</h1>
      <p v-if="description || $slots.description" class="text-sm text-muted-foreground">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
