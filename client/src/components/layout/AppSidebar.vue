<script setup>
import { computed } from 'vue'
import { X, HardHat } from 'lucide-vue-next'
import { buildNavSections } from '@/lib/navigation'
import { useAccessStore } from '@/stores/access'
import { cn } from '@/lib/utils'

defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const access = useAccessStore()
const sections = computed(() => buildNavSections({ isAdmin: access.isAdmin, locked: access.isLocked }))
</script>

<template>
  <!-- Mobile backdrop -->
  <Transition
    enter-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-active-class="transition-opacity duration-200"
    leave-to-class="opacity-0"
  >
    <div
      v-if="open"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      aria-hidden="true"
      @click="emit('close')"
    />
  </Transition>

  <aside
    :class="
      cn(
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-[#DBEAFE] transition-transform duration-200 lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )
    "
    aria-label="Primary"
  >
    <div class="flex h-14 items-center gap-2.5 border-b border-blue-200 px-4 sm:h-16">
      <span
        class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-info text-primary-foreground shadow-sm shadow-primary/30"
      >
        <HardHat class="h-5 w-5" />
      </span>
      <span class="text-lg font-bold tracking-tight text-slate-900">Worker Planner</span>
      <button
        type="button"
        class="ml-auto rounded-md p-1.5 text-slate-700 transition-colors hover:bg-blue-200/60 lg:hidden"
        aria-label="Close menu"
        @click="emit('close')"
      >
        <X class="h-5 w-5" />
      </button>
    </div>

    <nav class="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      <div v-for="section in sections" :key="section.title" class="space-y-1">
        <p class="px-3 text-xs font-semibold uppercase tracking-wider text-slate-700">
          {{ section.title }}
        </p>
        <RouterLink
          v-for="item in section.items"
          :key="item.label"
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-blue-200/60 hover:text-slate-900"
          active-class="bg-blue-300/60 text-slate-900 hover:bg-blue-300/60 hover:text-slate-900"
          @click="emit('close')"
        >
          <component :is="item.icon" class="h-4 w-4 shrink-0" />
          {{ item.label }}
        </RouterLink>
      </div>
    </nav>
  </aside>
</template>
