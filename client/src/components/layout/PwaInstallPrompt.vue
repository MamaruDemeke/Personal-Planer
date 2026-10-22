<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Download, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const show = ref(false)
let deferred = null

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e
    show.value = true
  })
  window.addEventListener('appinstalled', () => {
    show.value = false
    deferred = null
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', () => {})
})

async function install() {
  if (!deferred) return
  deferred.prompt()
  const { outcome } = await deferred.userChoice
  if (outcome === 'accepted') show.value = false
  deferred = null
}

function dismiss() {
  show.value = false
}
</script>

<template>
  <div
    v-if="show"
    class="fixed bottom-20 left-1/2 z-50 w-[92%] max-w-sm -translate-x-1/2 rounded-lg border bg-card p-3 shadow-lg lg:bottom-4"
  >
    <div class="flex items-center gap-3">
      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Download class="h-5 w-5" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium">Install Worker Planner</p>
        <p class="text-xs text-muted-foreground">Add to your home screen for offline access.</p>
      </div>
      <Button size="sm" @click="install">Install</Button>
      <button type="button" class="rounded p-1 text-muted-foreground hover:bg-accent" aria-label="Dismiss" @click="dismiss">
        <X class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
