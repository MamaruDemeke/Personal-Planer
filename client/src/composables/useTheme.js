import { ref, computed, watchEffect } from 'vue'

const THEME_KEY = 'planora-theme'

const stored =
  typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_KEY) : null
const isDark = ref(stored === 'dark')

watchEffect(() => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', isDark.value)
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(THEME_KEY, isDark.value ? 'dark' : 'light')
  }
})

/**
 * Global theme (dark/light) composable.
 * @returns {{ isDark: import('vue').Ref<boolean>, theme: import('vue').ComputedRef<string>, toggleTheme: () => void, setTheme: (v: boolean) => void }}
 */
export function useTheme() {
  const theme = computed(() => (isDark.value ? 'dark' : 'light'))

  function toggleTheme() {
    isDark.value = !isDark.value
  }

  function setTheme(value) {
    isDark.value = Boolean(value)
  }

  return { isDark, theme, toggleTheme, setTheme }
}
