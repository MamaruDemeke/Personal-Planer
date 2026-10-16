<script setup>
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { STATUS_BADGE, STATUS_LABELS_ALL } from '@/lib/constants'

const props = defineProps({
  task: { type: Object, required: true },
})

/** Stored status plus the derived "overdue" state. */
const status = computed(() => {
  const t = props.task
  const completed = t.isCompleted ?? t.status === 'completed'
  if (completed) return 'completed'
  const deadline = t.deadline ? new Date(t.deadline).getTime() : null
  const overdue = t.overdue ?? (deadline !== null && deadline < Date.now())
  if (overdue) return 'overdue'
  return t.status ?? 'not_started'
})
</script>

<template>
  <Badge :variant="STATUS_BADGE[status]">{{ STATUS_LABELS_ALL[status] }}</Badge>
</template>
