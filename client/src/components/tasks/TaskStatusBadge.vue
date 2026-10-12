<script setup>
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'

const props = defineProps({ status: { type: String, required: true } })

const map = {
  todo: { label: 'To Do', variant: 'muted' },
  in_progress: { label: 'In Progress', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
}

const config = computed(() => map[props.status] ?? { label: props.status, variant: 'outline' })
</script>

<template>
  <Badge :variant="config.variant">{{ config.label }}</Badge>
</template>
