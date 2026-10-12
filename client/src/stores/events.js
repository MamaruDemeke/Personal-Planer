import { createResourceStore } from '@/stores/createResourceStore'
import { events as seed } from '@/services/seed'

export const useEventsStore = createResourceStore('events', {
  table: 'events',
  seed: () => seed,
  order: 'start_time',
})
