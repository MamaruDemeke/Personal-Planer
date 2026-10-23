<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { X, HardHat } from 'lucide-vue-next'
import { buildNavSections } from '@/lib/navigation'
import { useAccessStore } from '@/stores/access'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const access = useAccessStore()
const route = useRoute()
const { t } = useI18n()
const sections = computed(() => buildNavSections({ isAdmin: access.isAdmin, locked: access.isLocked }))
const isActive = (item) => route.name === item.to.name
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
        'fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-blue-200/70 bg-gradient-to-b from-[#E0F2FE] via-[#F1F0FF] to-[#ECFDF5] transition-transform duration-200 dark:border-slate-700 dark:from-[#16232e] dark:via-[#1b1b2e] dark:to-[#122320] lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )
    "
    aria-label="Primary"
  >
    <div class="flex h-10 items-center gap-2 border-b border-blue-200/70 px-2.5 sm:h-12 dark:border-slate-700">
      <span
        class="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-info text-primary-foreground shadow-sm shadow-primary/30"
      >
        <HardHat class="h-3.5 w-3.5" />
      </span>
      <span class="text-[15px] font-bold tracking-tight text-slate-900 dark:text-slate-100">{{ t('app.title') }}</span>
      <button
        type="button"
        class="ml-auto rounded-md p-1.5 text-slate-700 transition-colors hover:bg-white/70 lg:hidden dark:text-slate-300 dark:hover:bg-slate-700/60"
        aria-label="Close menu"
        @click="emit('close')"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <nav class="flex-1 space-y-3.5 overflow-y-auto px-2.5 py-3">
      <div v-for="section in sections" :key="section.title" class="space-y-0.5">
        <p
          class="px-2.5 text-[10px] font-semibold uppercase tracking-wider"
          :style="{ color: section.color }"
        >
          {{ t(section.title) }}
        </p>
        <RouterLink
          v-for="item in section.items"
          :key="item.label"
          :to="item.to"
          class="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-slate-800 transition-colors hover:bg-white/70 dark:text-slate-200 dark:hover:bg-slate-700/50"
          :class="isActive(item) ? 'bg-white/90 shadow-sm dark:bg-slate-800/90' : ''"
          :style="isActive(item) ? { boxShadow: `inset 3px 0 0 ${item.color}` } : {}"
          @click="emit('close')"
        >
          <span
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors"
            :style="{
              backgroundColor: `color-mix(in oklab, ${item.color} 16%, transparent)`,
              color: item.color,
            }"
          >
            <component :is="item.icon" class="h-3.5 w-3.5" />
          </span>
          {{ t(item.label) }}
        </RouterLink>
      </div>
    </nav>
  </aside>
</template>
