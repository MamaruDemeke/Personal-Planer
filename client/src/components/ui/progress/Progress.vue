<script setup>
import { ProgressRoot, ProgressIndicator } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  class: { type: null, default: '' },
})
</script>

<template>
  <ProgressRoot
    :model-value="modelValue"
    :class="
      cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', props.class)
    "
  >
    <ProgressIndicator
      class="h-full w-full flex-1 bg-primary transition-all duration-500 ease-out"
      :style="`transform: translateX(-${100 - (modelValue || 0)}%)`"
    />
  </ProgressRoot>
</template>
