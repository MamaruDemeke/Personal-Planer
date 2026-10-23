<script setup>
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const props = defineProps({
  rows: { type: Number, default: 4 },
  class: { type: null, default: '' },
})
</script>

<template>
  <div :class="cn('space-y-2', props.class)" role="status" aria-busy="true">
    <span class="sr-only">Loading�?�</span>
    <Skeleton v-for="i in rows" :key="i" class="h-9 w-full" />
  </div>
</template>
