<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { Lock, Receipt } from 'lucide-vue-next'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import { Button } from '@/components/ui/button'
import { useAccessStore } from '@/stores/access'
import { useReminders } from '@/composables/useReminders'

const router = useRouter()
const access = useAccessStore()
const sidebarOpen = ref(false)
const reminders = useReminders()

onMounted(() => reminders.start())
onBeforeUnmount(() => reminders.stop())

const locked = computed(() => access.isLocked)

const lockMessage = computed(() => {
  switch (access.reason) {
    case 'pending':
      return 'Your payment is awaiting administrator approval. You can explore the app, but changes are disabled.'
    case 'rejected':
      return access.summary?.paymentReviewNote || 'Your last receipt was rejected. Submit a new one to continue.'
    case 'expired':
      return 'Your access period has expired. Renew your payment to make changes again.'
    case 'revoked':
      return access.summary?.paymentReviewNote || 'Your access has been revoked. Contact the administrator.'
    default:
      return 'Submit your payment receipt or transaction number to unlock creating and editing.'
  }
})

function goToPayment() {
  router.push({ name: 'access' })
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="lg:pl-64">
      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <div class="mx-auto w-full max-w-6xl space-y-4 sm:space-y-6">
          <div
            v-if="locked"
            class="flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/5 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="flex items-start gap-3">
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning-foreground"
              >
                <Lock class="h-4 w-4" />
              </span>
              <div class="space-y-0.5">
                <p class="text-sm font-medium">Account locked — read-only</p>
                <p class="text-sm text-muted-foreground">{{ lockMessage }}</p>
              </div>
            </div>
            <Button size="sm" class="shrink-0" @click="goToPayment">
              <Receipt class="h-4 w-4" />
              Submit payment
            </Button>
          </div>

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
