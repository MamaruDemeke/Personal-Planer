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
        'flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-14 text-center',
        props.class,
      )
    "
    role="alert"
  >
    <div
      class="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
    >
      <AlertTriangle class="h-6 w-6" />
    </div>
    <div class="space-y-1">
      <h3 class="text-base font-semibold">{{ title }}</h3>
      <p class="mx-auto max-w-sm text-sm text-muted-foreground">{{ description }}</p>
    </div>
    <Button variant="outline" size="sm" @click="$emit('retry')">
      <RotateCw class="h-4 w-4" />
      Try again
    </Button>
  </div>
</template>
