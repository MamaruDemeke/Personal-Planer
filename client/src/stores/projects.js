import { createResourceStore } from '@/stores/createResourceStore'

export const useProjectsStore = createResourceStore('projects', {
  table: 'projects',
})
