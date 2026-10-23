<script setup>
import { LayoutDashboard, ListTodo, CalendarDays, BookOpen, Menu } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'

const emit = defineEmits(['open-menu'])
const router = useRouter()
const { t } = useI18n()

const items = [
  { label: t('nav.dashboard'), icon: LayoutDashboard, to: { name: 'dashboard' } },
  { label: t('nav.tasks'), icon: ListTodo, to: { name: 'tasks' } },
  { label: t('nav.daily'), icon: CalendarDays, to: { name: 'plan-daily' } },
  { label: t('nav.diary'), icon: BookOpen, to: { name: 'diary' } },
]

function go(to) {
  router.push(to)
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-background/95 px-1 py-1 backdrop-blur-md lg:hidden"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <button
      v-for="item in items"
      :key="item.label"
      type="button"
      class="flex flex-col items-center gap-0.5 rounded-md px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-primary"
      @click="go(item.to)"
    >
      <component :is="item.icon" class="h-4 w-4" />
      {{ item.label }}
    </button>
    <button
      type="button"
      class="flex flex-col items-center gap-0.5 rounded-md px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-primary"
      @click="emit('open-menu')"
    >
      <Menu class="h-4 w-4" />
      {{ t('header.menu') }}
    </button>
  </nav>
</template>
