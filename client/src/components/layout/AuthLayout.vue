<script setup>
import { HardHat } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4 py-6">
    <div class="w-full max-w-md space-y-4">
      <RouterLink to="/" class="flex items-center justify-center gap-2">
        <span
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-info text-primary-foreground shadow-sm shadow-primary/30"
        >
          <HardHat class="h-4 w-4" />
        </span>
        <span class="text-gradient text-lg font-bold tracking-tight">Mezgab</span>
      </RouterLink>

      <div class="rounded-lg border bg-card/80 p-4 text-card-foreground shadow-sm backdrop-blur-sm sm:p-6">
        <div class="mb-4 space-y-1 text-center">
          <h1 class="text-lg font-semibold tracking-tight">{{ title }}</h1>
          <p v-if="subtitle" class="text-xs text-muted-foreground">{{ subtitle }}</p>
        </div>
        <slot />
      </div>

      <slot name="footer" />
    </div>
  </div>
</template>
