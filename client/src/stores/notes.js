import { createApiResourceStore } from '@/stores/createApiResourceStore'

export const useNotesStore = createApiResourceStore('notes', { basePath: '/notes' })
