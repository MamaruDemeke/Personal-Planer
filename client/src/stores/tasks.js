import { createResourceStore } from '@/stores/createResourceStore'

export const useTasksStore = createResourceStore('tasks', {
  table: 'tasks',
  order: 'created_at',
})
