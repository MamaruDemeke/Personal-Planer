<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({ class: { type: null, default: '' } })
</script>

<template>
  <div :class="cn('flex flex-col space-y-1 p-3.5 sm:p-4', props.class)">
    <slot />
  </div>
</template>
