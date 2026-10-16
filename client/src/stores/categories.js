import { createApiResourceStore } from '@/stores/createApiResourceStore'

export const useCategoriesStore = createApiResourceStore('categories', { basePath: '/categories' })
