<script setup>
import { useRouter } from 'vue-router'
import { Compass } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const router = useRouter()
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
    <div class="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <Compass class="h-7 w-7" />
    </div>
    <h1 class="text-2xl font-semibold">Page not found</h1>
    <p class="max-w-sm text-sm text-muted-foreground">
      The page you are looking for doesn't exist or has been moved.
    </p>
    <Button @click="router.push({ name: 'dashboard' })">Back to dashboard</Button>
  </div>
</template>
