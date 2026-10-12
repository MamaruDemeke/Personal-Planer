import { describe, expect, it } from 'vitest'
import { taskSchema } from './task'

describe('taskSchema', () => {
  it('accepts a minimal valid task and applies defaults', () => {
    const result = taskSchema.safeParse({ title: 'Write tests' })
    expect(result.success).toBe(true)
    expect(result.data.priority).toBe('medium')
    expect(result.data.status).toBe('todo')
  })

  it('rejects an empty or whitespace-only title', () => {
    expect(taskSchema.safeParse({ title: '' }).success).toBe(false)
    expect(taskSchema.safeParse({ title: '   ' }).success).toBe(false)
  })

  it('rejects an unknown priority', () => {
    const result = taskSchema.safeParse({ title: 'Task', priority: 'someday' })
    expect(result.success).toBe(false)
  })

  it('enforces the title length limit', () => {
    const result = taskSchema.safeParse({ title: 'a'.repeat(201) })
    expect(result.success).toBe(false)
  })
})
