import { createResourceStore } from '@/stores/createResourceStore'
import { notes as seed } from '@/services/seed'

export const useNotesStore = createResourceStore('notes', {
  table: 'notes',
  seed: () => seed,
  order: 'updated_at',
})
