<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({ class: { type: null, default: '' } })
</script>

<template>
  <hr :class="cn('shrink-0 bg-border h-px w-full', props.class)" />
</template>
