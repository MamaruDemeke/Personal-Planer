<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({
  title: { type: String, default: 'Nothing here yet' },
  description: { type: String, default: '' },
  class: { type: null, default: '' },
})
</script>

<template>
  <div
    :class="
      cn(
        'flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed bg-card/50 px-4 py-6 text-center sm:gap-3 sm:px-6 sm:py-8',
        props.class,
      )
    "
  >
    <div
      class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-info/10 text-primary"
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
