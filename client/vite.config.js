import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // The forked-worker pool can time out while spawning in constrained/CI
    // sandboxes; worker threads start reliably and are faster here.
    pool: 'threads',
    setupFiles: ['./src/tests/setup.js'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
  },
})
