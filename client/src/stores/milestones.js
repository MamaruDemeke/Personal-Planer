import { createResourceStore } from '@/stores/createResourceStore'

export const useMilestonesStore = createResourceStore('milestones', {
  table: 'goal_milestones',
  order: 'sort_order',
})
