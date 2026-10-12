import { createResourceStore } from '@/stores/createResourceStore'

export const useGoalsStore = createResourceStore('goals', {
  table: 'goals',
})
