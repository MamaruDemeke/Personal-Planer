import { createResourceStore } from '@/stores/createResourceStore'

export const useRemindersStore = createResourceStore('reminders', {
  table: 'reminders',
  order: 'remind_at',
})
