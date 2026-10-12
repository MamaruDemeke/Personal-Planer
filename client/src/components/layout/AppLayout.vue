<script setup>
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import { X } from 'lucide-vue-next'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

const ui = useUiStore()
const desktopWidth = computed(() => (ui.sidebarCollapsed ? 'w-[72px]' : 'w-64'))
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Desktop sidebar -->
    <aside
      :class="
        cn(
          'fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border transition-[width] duration-200 ease-in-out lg:block',
          desktopWidth,
        )
      "
    >
      <AppSidebar
        :collapsed="ui.sidebarCollapsed"
        @toggle-collapse="ui.toggleSidebar()"
      />
    </aside>

    <!-- Mobile drawer -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="ui.mobileNavOpen" class="fixed inset-0 z-50 lg:hidden">
        <div
          class="absolute inset-0 bg-black/50"
          aria-hidden="true"
          @click="ui.closeMobileNav()"
        />
        <Transition
          appear
          enter-active-class="transition-transform duration-200"
          enter-from-class="-translate-x-full"
          leave-active-class="transition-transform duration-200"
          leave-to-class="-translate-x-full"
        >
          <div class="absolute inset-y-0 left-0 w-72 shadow-xl">
            <button
              type="button"
              class="absolute right-3 top-4 z-10 rounded-md p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent"
              aria-label="Close navigation"
              @click="ui.closeMobileNav()"
            >
              <X class="h-5 w-5" />
            </button>
            <AppSidebar
              :show-collapse-toggle="false"
              @navigate="ui.closeMobileNav()"
            />
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Content -->
    <div :class="cn('flex min-h-screen flex-col transition-[padding] duration-200', 'lg:pl-64', ui.sidebarCollapsed && 'lg:pl-[72px]')">
      <AppHeader />
      <main class="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div class="mx-auto w-full max-w-7xl space-y-6">
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
