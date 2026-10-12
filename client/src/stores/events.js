import { createResourceStore } from '@/stores/createResourceStore'

export const useEventsStore = createResourceStore('events', {
  table: 'events',
  order: 'start_time',
})
