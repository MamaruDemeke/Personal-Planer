import { createResourceStore } from '@/stores/createResourceStore'

export const useCategoriesStore = createResourceStore('categories', {
  table: 'categories',
})
