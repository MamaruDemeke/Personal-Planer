<script setup>
import { AlertTriangle, RotateCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const props = defineProps({
  title: { type: String, default: 'Something went wrong' },
  description: { type: String, default: 'We could not load this content. Please try again.' },
  class: { type: null, default: '' },
})
defineEmits(['retry'])
</script>

<template>
  <div
    :class="
      cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-8 text-center',
        props.class,
      )
    "
    role="alert"
  >
    <div
      class="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive"
    >
      <AlertTriangle class="h-4 w-4" />
    </div>
    <div class="space-y-0.5">
      <h3 class="text-sm font-semibold">{{ title }}</h3>
      <p class="mx-auto max-w-sm text-xs text-muted-foreground">{{ description }}</p>
    </div>
    <Button variant="outline" size="sm" @click="$emit('retry')">
      <RotateCw class="h-4 w-4" />
      Try again
    </Button>
  </div>
</template>
