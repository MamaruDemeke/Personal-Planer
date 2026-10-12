<script setup>
import { ProgressRoot, ProgressIndicator } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  class: { type: null, default: '' },
  /** Optional class for the filled indicator (e.g. to tint it per status). */
  indicatorClass: { type: String, default: '' },
  /** Optional inline style merged onto the indicator (e.g. backgroundColor). */
  indicatorStyle: { type: Object, default: () => ({}) },
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
      :class="
        cn(
          'h-full w-full flex-1 bg-primary transition-all duration-500 ease-out',
          props.indicatorClass,
        )
      "
      :style="[`transform: translateX(-${100 - (modelValue || 0)}%)`, props.indicatorStyle]"
    />
  </ProgressRoot>
</template>
