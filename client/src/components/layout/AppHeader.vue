<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Bell,
  Menu,
  Moon,
  Search,
  Sun,
  User,
  Settings,
  LogOut,
} from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const auth = useAuthStore()
const toast = useToast()
const { isDark, toggleTheme } = useTheme()

const search = ref('')

const pageTitle = computed(() => route.meta?.title ?? 'Dashboard')

const notifications = ref([
  { id: 1, title: 'Welcome to Planora', body: 'Create your first task to get started.', time: 'now' },
])

const profileName = computed(() => auth.displayName)
const profileEmail = computed(() => auth.user?.email ?? 'Not signed in')
const initials = computed(() => auth.initials)

async function onSignOut() {
  await auth.signOut()
  toast.success('Signed out')
  if (auth.isConfigured) router.replace({ name: 'login' })
}
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6"
  >
    <Button
      variant="ghost"
      size="icon"
      class="lg:hidden"
      aria-label="Open navigation"
      @click="ui.toggleMobileNav()"
    >
      <Menu class="h-5 w-5" />
    </Button>

    <h2 class="truncate text-base font-semibold sm:text-lg lg:hidden">{{ pageTitle }}</h2>

    <div class="relative ml-auto hidden w-full max-w-sm items-center md:flex lg:ml-0">
      <Search class="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
      <Input
        v-model="search"
        type="search"
        placeholder="Search tasks, projects, notes…"
        class="pl-9"
        aria-label="Search"
      />
    </div>

    <div class="ml-auto flex items-center gap-1">
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
          <Button variant="ghost" size="icon" class="relative" aria-label="Notifications">
            <Bell class="h-5 w-5" />
            <span
              v-if="notifications.length"
              class="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
            >
              {{ notifications.length }}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-80">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            v-for="n in notifications"
            :key="n.id"
            class="flex flex-col items-start gap-0.5"
          >
            <span class="text-sm font-medium">{{ n.title }}</span>
            <span class="text-xs text-muted-foreground">{{ n.body }}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="justify-center text-xs text-muted-foreground">
            You are all caught up
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
          <DropdownMenuItem>
            <User class="h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem as-child>
            <RouterLink to="/settings" class="flex w-full items-center gap-2">
              <Settings class="h-4 w-4" />
              Settings
            </RouterLink>
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="auth.isAuthenticated" />
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
