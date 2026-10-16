<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import { useReminders } from '@/composables/useReminders'

const sidebarOpen = ref(false)
const reminders = useReminders()

onMounted(() => reminders.start())
onBeforeUnmount(() => reminders.stop())
</script>

<template>
  <div class="min-h-screen bg-background">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="lg:pl-64">
      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <div class="mx-auto w-full max-w-6xl space-y-4 sm:space-y-6">
          <RouterView v-slot="{ Component }">
            <Transition
              mode="out-in"
              enter-active-class="transition-opacity duration-150"
              enter-from-class="opacity-0"
              leave-active-class="transition-opacity duration-150"
              leave-to-class="opacity-0"
            >
              <component :is="Component" />
            </Transition>
          </RouterView>
        </div>
      </main>
    </div>
  </div>
</template>
