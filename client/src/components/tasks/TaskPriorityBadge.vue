<script setup>
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'

const props = defineProps({ priority: { type: String, required: true } })

const map = {
  low: { label: 'Low', variant: 'outline' },
  medium: { label: 'Medium', variant: 'info' },
  high: { label: 'High', variant: 'warning' },
  urgent: { label: 'Urgent', variant: 'destructive' },
}

const config = computed(() => map[props.priority] ?? { label: props.priority, variant: 'outline' })
</script>

<template>
  <Badge :variant="config.variant">{{ config.label }}</Badge>
</template>
