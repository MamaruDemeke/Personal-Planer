import { createResourceStore } from '@/stores/createResourceStore'
import { reminders as seed } from '@/services/seed'

export const useRemindersStore = createResourceStore('reminders', {
  table: 'reminders',
  seed: () => seed,
  order: 'remind_at',
})
