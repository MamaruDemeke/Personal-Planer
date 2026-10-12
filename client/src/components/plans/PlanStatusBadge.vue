<script setup>
import { Badge } from '@/components/ui/badge'
import { planStatusMeta } from '@/lib/constants'

const props = defineProps({
  status: { type: String, default: 'active' },
})

const meta = () => planStatusMeta[props.status] ?? planStatusMeta.active
</script>

<template>
  <Badge :variant="meta().variant">{{ meta().label }}</Badge>
</template>
