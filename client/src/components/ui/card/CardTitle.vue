<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({ class: { type: null, default: '' } })
</script>

<template>
  <h3 :class="cn('text-[13px] font-semibold leading-snug tracking-tight sm:text-sm', props.class)">
    <slot />
  </h3>
</template>
