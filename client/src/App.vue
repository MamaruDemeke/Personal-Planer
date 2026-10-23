<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { Toaster } from 'vue-sonner'
import { setLockedHandler } from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useAccessStore } from '@/stores/access'
import { unlockAudio } from '@/lib/ring'

const toast = useToast()
const access = useAccessStore()

/** Browsers block audio until the user interacts, so unlock once on first use. */
function unlock() {
  unlockAudio()
  window.removeEventListener('pointerdown', unlock)
  window.removeEventListener('keydown', unlock)
  window.removeEventListener('touchstart', unlock)
}

/**
 * Last-resort error surface: any promise rejection that reaches the top level
 * (i.e. was not handled by the action that triggered it) still shows a message
 * instead of failing silently.
 */
function onUnhandledRejection(event) {
  const reason = event?.reason
  if (reason?.name === 'ApiError' && reason?.status === 403) return // already surfaced by the locked handler
  const message =
    reason?.message || (typeof reason === 'string' ? reason : 'An unexpected error occurred')
  toast.error('Something went wrong', message)
  // eslint-disable-next-line no-console
  console.error(reason)
}

onMounted(() => {
  setLockedHandler(({ message }) => {
    toast.warning('Account locked', message)
    access.load(true).catch(() => {})
  })
  window.addEventListener('unhandledrejection', onUnhandledRejection)
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
  window.addEventListener('touchstart', unlock, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('unhandledrejection', onUnhandledRejection)
  window.removeEventListener('pointerdown', unlock)
  window.removeEventListener('keydown', unlock)
  window.removeEventListener('touchstart', unlock)
})
</script>

<template>
  <RouterView />
  <Toaster
    position="top-right"
    :toast-options="{ class: 'rounded-lg border bg-card text-card-foreground' }"
    rich-colors
    close-button
  />
</template>
