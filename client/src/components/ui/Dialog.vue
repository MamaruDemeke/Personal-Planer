<script setup>
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui'
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  class: { type: String, default: '' },
})
const emit = defineEmits(['update:open'])
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-fade-in"
      />
      <DialogContent
        :class="
          cn(
            'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border border-border bg-card p-6 shadow-lg sm:rounded-xl',
            'max-h-[90vh] overflow-y-auto scrollbar-thin animate-slide-up',
            $props.class,
          )
        "
      >
        <div class="flex flex-col space-y-1.5 text-left">
          <DialogTitle v-if="title" class="text-lg font-semibold leading-none tracking-tight">
            {{ title }}
          </DialogTitle>
          <DialogDescription v-if="description" class="text-sm text-muted-foreground">
            {{ description }}
          </DialogDescription>
        </div>
        <slot />
        <DialogClose
          class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Close"
        >
          <X class="h-4 w-4" />
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
