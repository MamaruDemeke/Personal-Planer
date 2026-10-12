import { describe, expect, it } from 'vitest'
import {
  computePlanProgress,
  deadlineLabel,
  derivedPlanStatus,
  planTasks,
  summarizePlans,
} from './planProgress'

const NOW = new Date('2026-06-15T12:00:00.000Z')

const plan = (over = {}) => ({
  id: 'p1',
  title: 'Ship the planner',
  period: 'weekly',
  status: 'active',
  deadline: '2026-06-20T12:00:00.000Z',
  finalProgress: null,
  completedAt: null,
  ...over,
})

const task = (over = {}) => ({
  id: Math.random().toString(36).slice(2),
  planId: 'p1',
  status: 'todo',
  ...over,
})

describe('planTasks', () => {
  it('only returns tasks linked to the plan', () => {
    const tasks = [task(), task({ planId: 'other' }), task()]
    expect(planTasks(tasks, 'p1')).toHaveLength(2)
    expect(planTasks(tasks, null)).toHaveLength(0)
  })
})

describe('computePlanProgress', () => {
  it('is zero when the plan has no linked tasks', () => {
    const p = computePlanProgress(plan(), [], NOW)
    expect(p.total).toBe(0)
    expect(p.completed).toBe(0)
    expect(p.remaining).toBe(0)
    expect(p.percent).toBe(0)
    expect(p.isOverdue).toBe(false)
  })

  it('derives counts and percentage from completed tasks', () => {
    const tasks = [task({ status: 'completed' }), task({ status: 'completed' }), task(), task()]
    const p = computePlanProgress(plan(), tasks, NOW)
    expect(p.total).toBe(4)
    expect(p.completed).toBe(2)
    expect(p.remaining).toBe(2)
    expect(p.percent).toBe(50)
    expect(p.livePercent).toBe(50)
  })

  it('flags a plan as overdue once the deadline passes but leaves it active', () => {
    const p = computePlanProgress(plan({ deadline: '2026-06-10T12:00:00.000Z' }), [task()], NOW)
    expect(p.isOverdue).toBe(true)
    expect(p.isCompleted).toBe(false)
    expect(derivedPlanStatus(plan({ deadline: '2026-06-10T12:00:00.000Z' }), p)).toBe('overdue')
  })

  it('does not mark a completed plan overdue even past its deadline', () => {
    const completedPlan = plan({ status: 'completed', deadline: '2026-06-01T12:00:00.000Z', completedAt: '2026-06-01T10:00:00.000Z' })
    const p = computePlanProgress(completedPlan, [], NOW)
    expect(p.isOverdue).toBe(false)
    expect(p.isCompleted).toBe(true)
  })

  it('prefers the stored final percentage for a completed plan', () => {
    const completedPlan = plan({ status: 'completed', finalProgress: 80 })
    const tasks = [task({ status: 'completed' }), task()]
    const p = computePlanProgress(completedPlan, tasks, NOW)
    expect(p.usingFinal).toBe(true)
    expect(p.percent).toBe(80)
    expect(p.livePercent).toBe(50)
  })

  it('clamps a stored final percentage into 0..100', () => {
    expect(computePlanProgress(plan({ status: 'completed', finalProgress: 140 }), [], NOW).percent).toBe(100)
    expect(computePlanProgress(plan({ status: 'completed', finalProgress: -5 }), [], NOW).percent).toBe(0)
  })
})

describe('deadlineLabel', () => {
  const fmt = (d) => new Date(d).toISOString().slice(0, 10)

  it('describes remaining and overdue states', () => {
    expect(deadlineLabel(computePlanProgress(plan({ deadline: '2026-06-18T12:00:00.000Z' }), [], NOW), plan())).toBe('3 days left')
    expect(deadlineLabel(computePlanProgress(plan({ deadline: '2026-06-13T12:00:00.000Z' }), [], NOW), plan())).toBe('Overdue by 2 days')
    expect(deadlineLabel(computePlanProgress(plan({ deadline: '2026-06-15T18:00:00.000Z' }), [], NOW), plan())).toBe('Due today')
    expect(deadlineLabel(computePlanProgress(plan({ deadline: null }), [], NOW), plan())).toBe('No deadline')
  })

  it('reports the completion date for completed plans', () => {
    const completedPlan = plan({ status: 'completed', completedAt: '2026-06-14T09:00:00.000Z' })
    const label = deadlineLabel(computePlanProgress(completedPlan, [], NOW), completedPlan, fmt)
    expect(label).toBe('Completed 2026-06-14')
  })
})

describe('summarizePlans', () => {
  it('counts each bucket and averages active progress', () => {
    const plans = [
      plan({ id: 'a', deadline: '2026-07-01T00:00:00.000Z' }),
      plan({ id: 'b', deadline: '2026-06-01T00:00:00.000Z' }),
      plan({ id: 'c', status: 'completed', finalProgress: 100 }),
      plan({ id: 'd', status: 'archived' }),
    ]
    const tasks = [
      task({ planId: 'a', status: 'completed' }),
      task({ planId: 'a' }),
      task({ planId: 'b', status: 'completed' }),
    ]
    const s = summarizePlans(plans, tasks, NOW)
    expect(s.total).toBe(4)
    expect(s.active).toBe(2)
    expect(s.completed).toBe(1)
    expect(s.overdue).toBe(1)
    expect(s.archived).toBe(1)
    expect(s.avgProgress).toBe(75) // a = 50%, b = 100%
  })
})
