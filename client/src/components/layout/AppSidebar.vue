<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { PanelLeftClose, PanelLeftOpen, Sparkles } from 'lucide-vue-next'
import { navigation } from '@/lib/navigation'
import { cn } from '@/lib/utils'

const props = defineProps({
  collapsed: { type: Boolean, default: false },
  showCollapseToggle: { type: Boolean, default: true },
})

const emit = defineEmits(['toggle-collapse', 'navigate'])

const route = useRoute()
const isActive = (to) => route.path === to || route.path.startsWith(`${to}/`)
const labelClass = computed(() => (props.collapsed ? 'sr-only' : 'truncate'))

/** Tint the active destination with its own accent color. */
const itemStyle = (item, active) =>
  active
    ? { color: item.accent, backgroundColor: `color-mix(in oklab, ${item.accent} 16%, transparent)` }
    : {}
</script>

<template>
  <div class="flex h-full flex-col bg-sidebar text-sidebar-foreground">
    <div
      class="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-3"
      :class="collapsed ? 'justify-center px-2' : ''"
    >
      <div
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-info text-primary-foreground shadow-sm shadow-primary/30"
      >
        <Sparkles class="h-5 w-5" />
      </div>
      <div v-if="!collapsed" class="min-w-0">
        <p class="text-gradient truncate text-sm font-bold tracking-tight">Planora</p>
        <p class="truncate text-xs text-muted-foreground">Personal planner</p>
      </div>
    </div>

    <nav class="flex-1 space-y-0.5 overflow-y-auto px-2 py-2 scrollbar-thin">
      <RouterLink
        v-for="item in navigation"
        :key="item.to"
        :to="item.to"
        :title="collapsed ? item.name : undefined"
        :style="itemStyle(item, isActive(item.to))"
        :class="
          cn(
            'group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            collapsed ? 'justify-center px-2' : '',
            isActive(item.to)
              ? 'font-semibold'
              : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          )
        "
        @click="emit('navigate')"
      >
        <span
          v-if="isActive(item.to) && !collapsed"
          class="absolute inset-y-1.5 left-0 w-1 rounded-full"
          :style="{ backgroundColor: item.accent }"
        />
        <component
          :is="item.icon"
          class="h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110"
        />
        <span :class="labelClass">{{ item.name }}</span>
      </RouterLink>
    </nav>

    <div v-if="showCollapseToggle" class="border-t border-sidebar-border p-2">
      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        :class="collapsed ? 'justify-center px-2' : ''"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="emit('toggle-collapse')"
      >
        <PanelLeftOpen v-if="collapsed" class="h-[18px] w-[18px]" />
        <PanelLeftClose v-else class="h-[18px] w-[18px]" />
        <span :class="labelClass">Collapse</span>
      </button>
    </div>
  </div>
</template>
