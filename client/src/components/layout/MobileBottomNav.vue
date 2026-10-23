<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, ListTodo, CalendarDays, BookOpen, Menu } from 'lucide-vue-next'
import { useI18n } from '@/lib/i18n'

const emit = defineEmits(['open-menu'])
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const items = computed(() => [
  { label: t('nav.dashboard'), icon: LayoutDashboard, to: { name: 'dashboard' }, color: '#0d9488' },
  { label: t('nav.tasks'), icon: ListTodo, to: { name: 'tasks' }, color: '#3b82f6' },
  { label: t('nav.daily'), icon: CalendarDays, to: { name: 'plan-daily' }, color: '#8b5cf6' },
  { label: t('nav.diary'), icon: BookOpen, to: { name: 'diary' }, color: '#ec4899' },
])

const isActive = (item) => route.name === item.to.name

function go(to) {
  router.push(to)
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-background/95 px-0.5 py-0.5 backdrop-blur-md lg:hidden"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <span
      class="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-teal-400 via-violet-400 to-pink-400"
      aria-hidden="true"
    />
    <button
      v-for="item in items"
      :key="item.label"
      type="button"
      class="flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-0.5 text-[9px] font-medium transition-colors"
      :class="isActive(item) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
      :style="isActive(item) ? { backgroundColor: `color-mix(in oklab, ${item.color} 12%, transparent)` } : {}"
      @click="go(item.to)"
    >
      <component :is="item.icon" class="h-3.5 w-3.5" :style="{ color: item.color }" />
      <span :style="isActive(item) ? { color: item.color } : {}">{{ item.label }}</span>
    </button>
    <button
      type="button"
      class="flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-0.5 text-[9px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      @click="emit('open-menu')"
    >
      <Menu class="h-3.5 w-3.5 text-slate-500" />
      {{ t('header.menu') }}
    </button>
  </nav>
</template>
