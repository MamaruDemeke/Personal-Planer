<script setup>
import { Badge } from '@/components/ui/badge'
import { PRIORITY_BADGE, PRIORITY_LABELS } from '@/lib/constants'

defineProps({
  priority: { type: String, default: 'medium' },
})
</script>

<template>
  <Badge :variant="PRIORITY_BADGE[priority]">{{ PRIORITY_LABELS[priority] }}</Badge>
</template>
