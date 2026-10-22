<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut, Menu, Moon, Search, Sun } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import { useI18n, availableLocales } from '@/lib/i18n'
import { gregorianToEthiopian, ETHIOPIAN_MONTHS_AMHARIC } from '@/lib/ethiopianCalendar'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import NotificationBell from './NotificationBell.vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

const emit = defineEmits(['toggle-sidebar'])

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()
const { isDark, toggleTheme } = useTheme()
const { locale, setLocale, t } = useI18n()

const search = ref('')

const ethDate = computed(() => {
  const e = gregorianToEthiopian(new Date())
  return `${e.day} ${ETHIOPIAN_MONTHS_AMHARIC[e.month - 1]} ${e.year}`
})

const profileName = computed(() => auth.displayName)
const profileEmail = computed(() => auth.user?.email ?? 'Not signed in')
const initials = computed(() => auth.initials)

function onSearch() {
  const term = search.value.trim()
  router.push({ name: 'tasks', query: term ? { search: term } : {} })
}

async function onSignOut() {
  await auth.signOut()
  toast.success('Signed out')
  if (auth.isConfigured) router.replace({ name: 'login' })
}
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur-md sm:h-16 sm:px-5 lg:px-8"
  >
    <button
      type="button"
      class="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent lg:hidden"
      aria-label="Open menu"
      @click="emit('toggle-sidebar')"
    >
      <Menu class="h-5 w-5" />
    </button>

    <form class="relative w-full max-w-sm" role="search" @submit.prevent="onSearch">
      <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        v-model="search"
        type="search"
        :placeholder="t('header.search')"
        class="pl-9"
        aria-label="Search tasks"
      />
    </form>

    <div class="ml-auto flex items-center gap-1">
      <select
        v-model="locale"
        class="h-8 rounded-md border bg-background px-2 text-xs"
        aria-label="Language"
        @change="setLocale(locale)"
      >
        <option v-for="l in availableLocales" :key="l.value" :value="l.value">{{ l.label }}</option>
      </select>
      <span class="hidden text-xs font-medium text-muted-foreground sm:inline">
        {{ ethDate }}
      </span>
      <NotificationBell v-if="auth.isAuthenticated" />

      <Button
        variant="ghost"
        size="icon"
        :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
        @click="toggleTheme()"
      >
        <Sun v-if="isDark" class="h-5 w-5" />
        <Moon v-else class="h-5 w-5" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button
            type="button"
            class="ml-1 flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Account menu"
          >
            <Avatar>
              <AvatarFallback>{{ initials }}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56">
          <DropdownMenuLabel class="font-normal">
            <div class="flex flex-col space-y-0.5">
              <span class="text-sm font-medium">{{ profileName }}</span>
              <span class="text-xs text-muted-foreground">{{ profileEmail }}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem as-child>
            <RouterLink :to="{ name: 'settings' }" class="flex w-full items-center gap-2">
              Settings
            </RouterLink>
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="auth.isAuthenticated"
            class="text-destructive focus:text-destructive"
            @select="onSignOut"
          >
            <LogOut class="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
          <DropdownMenuItem v-else as-child>
            <RouterLink to="/login" class="flex w-full items-center gap-2">
              <LogOut class="h-4 w-4" />
              Sign in
            </RouterLink>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>
