import { createResourceStore } from '@/stores/createResourceStore'

export const useNotesStore = createResourceStore('notes', {
  table: 'notes',
  order: 'updated_at',
})
