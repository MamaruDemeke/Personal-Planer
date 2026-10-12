import { createResourceStore } from '@/stores/createResourceStore'
import { projects as seed } from '@/services/seed'

export const useProjectsStore = createResourceStore('projects', {
  table: 'projects',
  seed: () => seed,
})
