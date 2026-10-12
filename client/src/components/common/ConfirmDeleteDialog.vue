<script setup>
import { AlertTriangle, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import Dialog from '@/components/ui/Dialog.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Delete item' },
  description: {
    type: String,
    default: 'This action cannot be undone. Are you sure you want to continue?',
  },
  confirmLabel: { type: String, default: 'Delete' },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['update:open', 'confirm'])
</script>

<template>
  <Dialog
    :open="props.open"
    :title="props.title"
    :description="props.description"
    @update:open="emit('update:open', $event)"
  >
    <div class="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
      <AlertTriangle class="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
      <p class="text-sm text-muted-foreground">
        Are you sure? This will permanently remove the item and cannot be recovered.
      </p>
    </div>
    <div class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="outline" :disabled="loading" @click="emit('update:open', false)">
        Cancel
      </Button>
      <Button variant="destructive" :disabled="loading" @click="emit('confirm')">
        <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
        {{ confirmLabel }}
      </Button>
    </div>
  </Dialog>
</template>
