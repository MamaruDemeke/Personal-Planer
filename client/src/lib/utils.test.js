import { describe, expect, it } from 'vitest'
import { cn, percentage } from './utils'

describe('cn', () => {
  it('merges conditional classes and resolves Tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-sm', false && 'hidden', 'font-medium')).toBe('text-sm font-medium')
  })
})

describe('percentage', () => {
  it('rounds a normal ratio', () => {
    expect(percentage(3, 4)).toBe('75%')
  })

  it('never divides by zero or negative totals', () => {
    expect(percentage(5, 0)).toBe('0%')
    expect(percentage(5, -1)).toBe('0%')
  })

  it('clamps results to the 0-100 range', () => {
    expect(percentage(200, 100)).toBe('100%')
  })

  it('guards against non-finite inputs', () => {
    expect(percentage(Number.NaN, Number.NaN)).toBe('0%')
  })
})
