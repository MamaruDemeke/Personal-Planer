import { createResourceStore } from '@/stores/createResourceStore'
import { goalMilestones as seed } from '@/services/seed'

export const useMilestonesStore = createResourceStore('milestones', {
  table: 'goal_milestones',
  seed: () => seed,
  order: 'sort_order',
})
