<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({ class: { type: null, default: '' } })
</script>

<template>
  <div :class="cn('flex flex-col space-y-0.5 p-2.5 sm:p-3', props.class)">
    <slot />
  </div>
</template>
