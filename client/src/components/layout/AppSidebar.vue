<script setup>
import { computed } from 'vue'
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
const { t } = useI18n()
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
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-gradient-to-b from-[#DBEAFE] via-[#EFF6FF] to-white transition-transform duration-200 lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )
    "
    aria-label="Primary"
  >
    <div class="flex h-12 items-center gap-2 border-b border-blue-200 px-3 sm:h-14">
      <span
        class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-info text-primary-foreground shadow-sm shadow-primary/30"
      >
        <HardHat class="h-4 w-4" />
      </span>
      <span class="text-base font-bold tracking-tight text-slate-900">{{ t('app.title') }}</span>
      <button
        type="button"
        class="ml-auto rounded-md p-1.5 text-slate-700 transition-colors hover:bg-blue-200/60 lg:hidden"
        aria-label="Close menu"
        @click="emit('close')"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <nav class="flex-1 space-y-3.5 overflow-y-auto px-2.5 py-3">
      <div v-for="section in sections" :key="section.title" class="space-y-0.5">
        <p class="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
          {{ t(section.title) }}
        </p>
        <RouterLink
          v-for="item in section.items"
          :key="item.label"
          :to="item.to"
          class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-slate-800 transition-colors hover:bg-blue-200/60 hover:text-slate-900"
          active-class="bg-gradient-to-r from-blue-400/40 to-indigo-400/40 text-blue-900 font-semibold shadow-sm border-l-4 border-blue-600"
          @click="emit('close')"
        >
          <component :is="item.icon" class="h-4 w-4 shrink-0" />
          {{ t(item.label) }}
        </RouterLink>
      </div>
    </nav>
  </aside>
</template>
