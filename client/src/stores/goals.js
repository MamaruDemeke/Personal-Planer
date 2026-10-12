import { createResourceStore } from '@/stores/createResourceStore'
import { goals as seed } from '@/services/seed'

export const useGoalsStore = createResourceStore('goals', {
  table: 'goals',
  seed: () => seed,
})
