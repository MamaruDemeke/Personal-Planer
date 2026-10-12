import { createResourceStore } from '@/stores/createResourceStore'
import { categories as seed } from '@/services/seed'

export const useCategoriesStore = createResourceStore('categories', {
  table: 'categories',
  seed: () => seed,
})
