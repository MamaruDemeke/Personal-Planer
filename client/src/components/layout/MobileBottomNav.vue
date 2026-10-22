<script setup>
import { LayoutDashboard, ListTodo, CalendarDays, BookOpen, Menu } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'

const emit = defineEmits(['open-menu'])
const router = useRouter()

const items = [
  { label: 'Home', icon: LayoutDashboard, to: { name: 'dashboard' } },
  { label: 'Tasks', icon: ListTodo, to: { name: 'tasks' } },
  { label: 'Plan', icon: CalendarDays, to: { name: 'plan-daily' } },
  { label: 'Diary', icon: BookOpen, to: { name: 'diary' } },
]

function go(to) {
  router.push(to)
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-background/95 px-2 py-1.5 backdrop-blur-md lg:hidden"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <button
      v-for="item in items"
      :key="item.label"
      type="button"
      class="flex flex-col items-center gap-0.5 rounded-md px-3 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-primary"
      @click="go(item.to)"
    >
      <component :is="item.icon" class="h-5 w-5" />
      {{ item.label }}
    </button>
    <button
      type="button"
      class="flex flex-col items-center gap-0.5 rounded-md px-3 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-primary"
      @click="emit('open-menu')"
    >
      <Menu class="h-5 w-5" />
      More
    </button>
  </nav>
</template>
