import { describe, expect, it } from 'vitest'
import { taskSchema, reportSchema, categorySchema } from './index'

describe('taskSchema', () => {
  it('accepts a minimal valid task and applies defaults', () => {
    const result = taskSchema.safeParse({ title: 'Write tests' })
    expect(result.success).toBe(true)
    expect(result.data.progress).toBe(0)
    expect(result.data.priority).toBe('medium')
    expect(result.data.status).toBe('not_started')
    expect(result.data.plan).toBe('daily')
    expect(result.data.startDate).toBeNull()
    expect(result.data.deadline).toBeNull()
    expect(result.data.categoryId).toBeNull()
  })

  it('rejects an empty or whitespace-only title', () => {
    expect(taskSchema.safeParse({ title: '' }).success).toBe(false)
    expect(taskSchema.safeParse({ title: '   ' }).success).toBe(false)
  })

  it('enforces the title length limit', () => {
    expect(taskSchema.safeParse({ title: 'a'.repeat(201) }).success).toBe(false)
  })

  it('coerces progress and rejects values outside 0..100', () => {
    expect(taskSchema.safeParse({ title: 'Task', progress: '50' }).data.progress).toBe(50)
    expect(taskSchema.safeParse({ title: 'Task', progress: '' }).data.progress).toBe(0)
    expect(taskSchema.safeParse({ title: 'Task', progress: 150 }).success).toBe(false)
    expect(taskSchema.safeParse({ title: 'Task', progress: -1 }).success).toBe(false)
  })

  it('rejects a deadline that precedes the start date', () => {
    const result = taskSchema.safeParse({
      title: 'Task',
      startDate: '2026-06-10T10:00',
      deadline: '2026-06-01T10:00',
    })
    expect(result.success).toBe(false)
  })

  it('accepts a chronologically valid start/deadline range', () => {
    const result = taskSchema.safeParse({
      title: 'Task',
      startDate: '2026-06-01T10:00',
      deadline: '2026-06-10T10:00',
    })
    expect(result.success).toBe(true)
  })

  it('accepts a plan horizon and rejects unknown ones', () => {
    expect(taskSchema.safeParse({ title: 'Task', plan: 'weekly' }).data.plan).toBe('weekly')
    expect(taskSchema.safeParse({ title: 'Task', plan: 'hourly' }).success).toBe(false)
  })
})

describe('reportSchema', () => {
  it('requires a YYYY-MM-DD date', () => {
    expect(reportSchema.safeParse({ reportDate: '2026-06-01' }).success).toBe(true)
    expect(reportSchema.safeParse({ reportDate: '01/06/2026' }).success).toBe(false)
  })

  it('coerces empty text sections to null', () => {
    const result = reportSchema.safeParse({ reportDate: '2026-06-01', completed: '' })
    expect(result.data.completed).toBeNull()
  })
})

describe('categorySchema', () => {
  it('requires a non-empty name and defaults the colour', () => {
    const result = categorySchema.safeParse({ name: 'Site work' })
    expect(result.success).toBe(true)
    expect(result.data.color).toBe('#0d9488')
  })

  it('rejects invalid colours', () => {
    expect(categorySchema.safeParse({ name: 'X', color: 'red' }).success).toBe(false)
  })
})
