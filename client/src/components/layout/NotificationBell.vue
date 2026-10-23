<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, BellRing, PlayCircle, ShieldCheck, Trash2, Volume2, VolumeX, X } from 'lucide-vue-next'
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
import { isSoundEnabled, ring, setSoundEnabled, unlockAudio } from '@/lib/ring'
import { showSystemNotification } from '@/lib/notify'

const reminders = useReminders()
const notifications = useNotificationsStore()
const access = useAccessStore()
const toast = useToast()
const router = useRouter()

const enabled = reminders.enabled
const overdue = reminders.visibleOverdue
const upcoming = reminders.visibleUpcoming
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

/** Remove a single notification once it has been seen. */
function dismissNotification(id) {
  notifications.dismiss(id)
}

/** Remove a single task reminder once it has been seen. */
function dismissReminder(id) {
  reminders.dismissTask(id)
}

/** Remove every listed notification and reminder. */
function clearAll() {
  notifications.dismissAll()
  reminders.dismissAll()
}

async function enable() {
  unlockAudio()
  const result = await reminders.requestPermission()
  if (result === 'granted') {
    toast.success('Notifications enabled', "You'll be alerted about due and overdue tasks.")
  } else if (result === 'denied') {
    toast.error('Notifications blocked', 'Allow notifications in your browser settings.')
  }
}

const soundOn = ref(isSoundEnabled())

function toggleSound() {
  unlockAudio()
  soundOn.value = setSoundEnabled(!soundOn.value)
}

async function testAlert() {
  unlockAudio()
  ring({ force: true })
  const shown = await showSystemNotification(
    'Mezgab reminder',
    'This is how a task reminder will ring and appear on your phone.',
    { tag: 'mezgab-test', sticky: true },
  )
  if (shown) toast.info('Test notification sent', 'Check your notification shade.')
  else toast.warning('Sound played', 'Allow notifications to also show the system alert.')
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
        <template v-if="notifications.visibleItems.length">
          <p class="px-2 pt-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            {{ access.isAdmin ? 'Payments to verify' : 'Payment updates' }}
          </p>
          <div
            v-for="item in notifications.visibleItems.slice(0, 6)"
            :key="item.id"
            class="group flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent"
            @click="openReview"
          >
            <div class="min-w-0 flex-1">
              <p class="flex items-center gap-1.5 truncate text-sm">
                <ShieldCheck class="h-3.5 w-3.5 shrink-0 text-primary" />
                {{ item.title }}
              </p>
              <p class="truncate text-xs text-muted-foreground">{{ item.body }}</p>
            </div>
            <button
              type="button"
              class="shrink-0 rounded-md p-1 text-muted-foreground opacity-70 transition hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
              :aria-label="`Delete notification: ${item.title}`"
              @click.stop="dismissNotification(item.id)"
            >
              <X class="h-3.5 w-3.5" />
            </button>
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
            class="group flex items-start gap-2 rounded-md px-2 py-1.5"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm">{{ task.title }}</p>
              <p class="text-xs text-muted-foreground">{{ formatDue(task.deadline) }}</p>
            </div>
            <button
              type="button"
              class="shrink-0 rounded-md p-1 text-muted-foreground opacity-70 transition hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
              :aria-label="`Delete reminder: ${task.title}`"
              @click.stop="dismissReminder(task.id)"
            >
              <X class="h-3.5 w-3.5" />
            </button>
          </div>
        </template>

        <template v-if="dueSoonCount">
          <p class="px-2 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Due soon
          </p>
          <div
            v-for="task in upcoming.slice(0, 5)"
            :key="task.id"
            class="group flex items-start gap-2 rounded-md px-2 py-1.5"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm">{{ task.title }}</p>
              <p class="text-xs text-muted-foreground">{{ formatDue(task.deadline) }}</p>
            </div>
            <button
              type="button"
              class="shrink-0 rounded-md p-1 text-muted-foreground opacity-70 transition hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
              :aria-label="`Delete reminder: ${task.title}`"
              @click.stop="dismissReminder(task.id)"
            >
              <X class="h-3.5 w-3.5" />
            </button>
          </div>
        </template>

        <p
          v-if="!notifications.visibleItems.length && !overdue.length && !upcoming.length"
          class="px-2 py-6 text-center text-sm text-muted-foreground"
        >
          You're all caught up.
        </p>
      </div>

      <DropdownMenuSeparator />
      <DropdownMenuItem
        v-if="notifications.visibleItems.length || overdue.length || upcoming.length"
        class="justify-center text-destructive focus:text-destructive"
        @select="clearAll"
      >
        <Trash2 class="h-4 w-4" />
        Clear all notifications
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="notifications.visibleItems.length"
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
      <DropdownMenuItem
        v-if="reminders.supported && enabled"
        class="justify-center text-primary focus:text-primary"
        @select="testAlert"
      >
        <PlayCircle class="h-4 w-4" />
        Test ring &amp; notification
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="reminders.supported"
        class="justify-center"
        @select="toggleSound"
      >
        <Volume2 v-if="soundOn" class="h-4 w-4" />
        <VolumeX v-else class="h-4 w-4" />
        {{ soundOn ? 'Turn ring sound off' : 'Turn ring sound on' }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
