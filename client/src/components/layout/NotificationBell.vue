<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, BellRing, ShieldCheck } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useReminders } from '@/composables/useReminders'
import { useToast } from '@/composables/useToast'
import { useNotificationsStore } from '@/stores/notifications'
import { useAccessStore } from '@/stores/access'
import { formatDue } from '@/lib/format'

const reminders = useReminders()
const notifications = useNotificationsStore()
const access = useAccessStore()
const toast = useToast()
const router = useRouter()

const enabled = reminders.enabled
const overdue = reminders.overdue
const upcoming = reminders.upcoming
const dueSoonCount = reminders.dueSoonCount
const totalCount = computed(() => (reminders.totalCount?.value ?? reminders.totalCount ?? 0) + (notifications.pendingCount?.value ?? notifications.pendingCount ?? 0))

let timer = null
onMounted(() => {
  notifications.load()
  timer = setInterval(() => notifications.load(), 60_000)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const reviewTarget = computed(() => (access.isAdmin ? 'admin' : 'access'))

function openReview() {
  router.push({ name: reviewTarget.value })
}

async function enable() {
  const result = await reminders.requestPermission()
  if (result === 'granted') {
    toast.success('Notifications enabled', "You'll be alerted about due and overdue tasks.")
  } else if (result === 'denied') {
    toast.error('Notifications blocked', 'Allow notifications in your browser settings.')
  }
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" class="relative" aria-label="Notifications">
        <BellRing v-if="totalCount" class="h-5 w-5" />
        <Bell v-else class="h-5 w-5" />
        <Badge
          v-if="totalCount"
          variant="destructive"
          class="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1 text-[10px]"
        >
          {{ totalCount > 9 ? '9+' : totalCount }}
        </Badge>
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent class="w-80">
      <DropdownMenuLabel class="flex items-center justify-between font-normal">
        <span class="text-sm font-medium">Notifications</span>
        <span class="text-xs text-muted-foreground">{{ totalCount }} new</span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      <div class="max-h-72 overflow-y-auto p-1">
        <template v-if="notifications.items.length">
          <p class="px-2 pt-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            {{ access.isAdmin ? 'Payments to verify' : 'Payment updates' }}
          </p>
          <div
            v-for="item in notifications.items.slice(0, 6)"
            :key="item.id"
            class="cursor-pointer rounded-md px-2 py-1.5 transition-colors hover:bg-accent"
            @click="openReview"
          >
            <p class="flex items-center gap-1.5 truncate text-sm">
              <ShieldCheck class="h-3.5 w-3.5 shrink-0 text-primary" />
              {{ item.title }}
            </p>
            <p class="truncate text-xs text-muted-foreground">{{ item.body }}</p>
          </div>
          <DropdownMenuSeparator v-if="overdue.length || upcoming.length" />
        </template>

        <template v-if="overdue.length">
          <p class="px-2 pt-1.5 text-xs font-semibold uppercase tracking-wide text-destructive">
            Overdue
          </p>
          <div
            v-for="task in overdue.slice(0, 5)"
            :key="task.id"
            class="rounded-md px-2 py-1.5"
          >
            <p class="truncate text-sm">{{ task.title }}</p>
            <p class="text-xs text-muted-foreground">{{ formatDue(task.deadline) }}</p>
          </div>
        </template>

        <template v-if="dueSoonCount">
          <p class="px-2 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Due soon
          </p>
          <div
            v-for="task in upcoming.slice(0, 5)"
            :key="task.id"
            class="rounded-md px-2 py-1.5"
          >
            <p class="truncate text-sm">{{ task.title }}</p>
            <p class="text-xs text-muted-foreground">{{ formatDue(task.deadline) }}</p>
          </div>
        </template>

        <p
          v-if="!notifications.items.length && !overdue.length && !upcoming.length"
          class="px-2 py-6 text-center text-sm text-muted-foreground"
        >
          You're all caught up.
        </p>
      </div>

      <DropdownMenuSeparator />
      <DropdownMenuItem
        v-if="notifications.items.length"
        class="justify-center text-primary focus:text-primary"
        @select="openReview"
      >
        <ShieldCheck class="h-4 w-4" />
        {{ access.isAdmin ? 'Review pending payments' : 'View payment status' }}
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="reminders.supported && !enabled"
        class="justify-center text-primary focus:text-primary"
        @select="enable"
      >
        <Bell class="h-4 w-4" />
        Enable browser notifications
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
