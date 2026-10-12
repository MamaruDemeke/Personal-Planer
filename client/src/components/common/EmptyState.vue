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
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 px-4 py-10 text-center sm:gap-4 sm:px-6 sm:py-14',
        props.class,
      )
    "
  >
    <div
      class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-info/10 text-primary"
    >
      <slot name="icon" />
    </div>
    <div class="space-y-1">
      <h3 class="text-base font-semibold">{{ title }}</h3>
      <p v-if="description" class="mx-auto max-w-sm text-sm text-muted-foreground">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.action" class="pt-1">
      <slot name="action" />
    </div>
  </div>
</template>
