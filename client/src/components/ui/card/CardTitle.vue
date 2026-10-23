<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({ class: { type: null, default: '' } })
</script>

<template>
  <h3 :class="cn('text-xs font-semibold leading-snug tracking-tight sm:text-[13px]', props.class)">
    <slot />
  </h3>
</template>
