import { createApiResourceStore } from '@/stores/createApiResourceStore'

export const useTasksStore = createApiResourceStore('tasks', { basePath: '/tasks' })
