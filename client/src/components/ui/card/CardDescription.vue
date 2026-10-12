<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({ class: { type: null, default: '' } })
</script>

<template>
  <p :class="cn('text-xs text-muted-foreground sm:text-sm', props.class)">
    <slot />
  </p>
</template>
