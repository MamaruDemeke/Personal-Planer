import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'
import '@/assets/styles/main.css'
import 'vue-sonner/style.css'

const app = createApp(App)

app.use(createPinia())

// Restore any persisted Supabase session before the first route resolves so
// navigation guards see the correct auth state.
const auth = useAuthStore()
await auth.initialize()

app.use(router)

app.mount('#app')

// Register the service worker for PWA / offline app-shell caching.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
