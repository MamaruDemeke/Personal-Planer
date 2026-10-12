<script setup>
import { Toaster } from 'vue-sonner'
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
