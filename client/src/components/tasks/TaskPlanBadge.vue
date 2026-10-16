<script setup>
import { Badge } from '@/components/ui/badge'
import { PLAN_BADGE, PLAN_LABELS } from '@/lib/constants'

defineProps({
  plan: { type: String, default: 'daily' },
})
</script>

<template>
  <Badge :variant="PLAN_BADGE[plan]">{{ PLAN_LABELS[plan] }}</Badge>
</template>
