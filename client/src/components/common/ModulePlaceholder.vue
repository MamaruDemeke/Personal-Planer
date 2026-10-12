<script setup>
import PageHeader from './PageHeader.vue'
import EmptyState from './EmptyState.vue'
import { Card, CardContent } from '@/components/ui/card'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  emptyTitle: { type: String, default: '' },
  emptyDescription: {
    type: String,
    default: 'This module is scheduled for a later phase.',
  },
  icon: { type: [Object, Function], default: null },
  phase: { type: String, default: '' },
})
</script>

<template>
  <div class="space-y-6">
    <PageHeader :title="props.title" :description="props.description" />
    <Card>
      <CardContent class="pt-6">
        <EmptyState
          :title="props.emptyTitle || `${props.title} is coming soon`"
          :description="props.emptyDescription"
          class="border-0 bg-transparent"
        >
          <template v-if="props.icon" #icon>
            <component :is="props.icon" class="h-5 w-5" />
          </template>
          <p
            v-if="props.phase"
            class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            {{ props.phase }}
          </p>
        </EmptyState>
      </CardContent>
    </Card>
  </div>
</template>
