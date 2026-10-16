<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { Toaster } from 'vue-sonner'
import { setLockedHandler } from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useAccessStore } from '@/stores/access'

const toast = useToast()
const access = useAccessStore()

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
})

onBeforeUnmount(() => {
  window.removeEventListener('unhandledrejection', onUnhandledRejection)
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
