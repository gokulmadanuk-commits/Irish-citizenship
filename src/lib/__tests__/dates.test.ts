import { describe, expect, it } from 'vitest'
import { absenceDaysInWindow, addDays, addYears, daysBetween, overlapDays } from '../dates'

describe('date maths', () => {
  it('counts whole days between dates', () => {
    expect(daysBetween('2024-01-01', '2024-01-31')).toBe(30)
    expect(daysBetween('2023-01-01', '2024-01-01')).toBe(365)
    expect(daysBetween('2024-01-01', '2025-01-01')).toBe(366) // leap year
  })

  it('adds years and days', () => {
    expect(addYears('2026-09-05', -3)).toBe('2023-09-05')
    expect(addDays('2026-09-05', 10)).toBe('2026-09-15')
  })

  it('treats travel days as days present', () => {
    // Left on the 1st, back on the 5th: 3 full days away.
    expect(absenceDaysInWindow('2026-03-01', '2026-03-05', '2026-01-01', '2026-12-31')).toBe(3)
  })

  it('only counts the part of a trip inside the window', () => {
    expect(absenceDaysInWindow('2025-12-20', '2026-01-10', '2026-01-01', '2026-12-31')).toBe(8)
  })

  it('ignores trips fully outside the window', () => {
    expect(absenceDaysInWindow('2020-01-01', '2020-02-01', '2026-01-01', '2026-12-31')).toBe(0)
  })

  it('measures overlap between two periods', () => {
    expect(overlapDays('2026-01-01', '2026-06-01', '2026-03-01', '2026-09-01')).toBe(92)
    expect(overlapDays('2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01')).toBe(0)
  })
})
