<script setup>
import { Sparkles } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4 py-10">
    <div class="w-full max-w-md space-y-6">
      <RouterLink to="/" class="flex items-center justify-center gap-2">
        <span
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"
        >
          <Sparkles class="h-5 w-5" />
        </span>
        <span class="text-xl font-semibold tracking-tight">Planora</span>
      </RouterLink>

      <div class="rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
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
