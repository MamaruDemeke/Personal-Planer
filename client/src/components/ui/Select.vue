<script setup>
import { cn } from '@/lib/utils'

defineProps({
  modelValue: { type: [String, Number], default: '' },
  class: { type: String, default: '' },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <select
    :value="modelValue"
    :class="
      cn(
        'flex h-8 w-full items-center rounded-md border border-input bg-background px-2.5 py-1 text-[16px] sm:text-[13px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        $props.class,
      )
    "
    @change="$emit('update:modelValue', $event.target.value)"
  >
    <slot />
  </select>
</template>
