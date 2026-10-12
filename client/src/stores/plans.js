import { createResourceStore } from '@/stores/createResourceStore'

export const usePlansStore = createResourceStore('plans', {
  table: 'plans',
  order: 'created_at',
})
