import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDashboardStore } from './dashboard'

describe('useDashboardStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts empty and unloaded', () => {
    const store = useDashboardStore()
    expect(store.loadedAt).toBeNull()
    expect(store.totalTasks).toBe(0)
    expect(store.completionRate).toBe('0%')
  })

  it('derives every statistic from the loaded records', async () => {
    const store = useDashboardStore()
    await store.load()

    expect(store.error).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.loadedAt).not.toBeNull()

    // Status buckets must add up to the total — no task counted twice.
    const todo = store.tasks.filter((t) => t.status === 'todo').length
    const buckets =
      store.completedTasks.length + store.inProgress + todo
    expect(buckets).toBe(store.totalTasks)

    // Completion percentage is derived, not hardcoded.
    const total = store.totalTasks
    const completed = store.completedTasks.length
    const expectedRate = total === 0 ? '0%' : `${Math.round((completed / total) * 100)}%`
    expect(store.completionRate).toBe(expectedRate)
  })

  it('computes goal completion as a bounded average', async () => {
    const store = useDashboardStore()
    await store.load()
    expect(store.goalCompletion).toBeGreaterThanOrEqual(0)
    expect(store.goalCompletion).toBeLessThanOrEqual(100)
  })
})
