import { createResourceStore } from '@/stores/createResourceStore'
import { tasks as seed } from '@/services/seed'

export const useTasksStore = createResourceStore('tasks', {
  table: 'tasks',
  seed: () => seed,
  order: 'created_at',
})
