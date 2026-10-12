<script setup>
import { Sparkles } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4 py-10">
    <div class="w-full max-w-md space-y-6">
      <RouterLink to="/" class="flex items-center justify-center gap-2">
        <span
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-info text-primary-foreground shadow-sm shadow-primary/30"
        >
          <Sparkles class="h-5 w-5" />
        </span>
        <span class="text-gradient text-xl font-bold tracking-tight">Planora</span>
      </RouterLink>

      <div class="rounded-xl border bg-card/80 p-6 text-card-foreground shadow-sm backdrop-blur-sm sm:p-8">
        <div class="mb-6 space-y-1 text-center">
          <h1 class="text-xl font-semibold tracking-tight">{{ title }}</h1>
          <p v-if="subtitle" class="text-sm text-muted-foreground">{{ subtitle }}</p>
        </div>
        <slot />
      </div>

      <slot name="footer" />
    </div>
  </div>
</template>
