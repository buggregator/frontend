import { describe, expect, it } from 'vitest'
import { formatDuration } from './format-duration'

describe('formatDuration', () => {
  // The profiler's callers pass microseconds and get every part.
  it.each([
    [0, ''],
    [1_500, '1.5000 ms'],
    [340_000, '340 ms'],
    [65_000_000, '1 m, 5 s'],
    [65_300_000, '1 m, 5 s, 300 ms'],
    [90_061_000_000, '1 d, 1 h, 1 m, 1 s'],
    [-2_000_000, '2 s']
  ])('default: %s µs → %s', (us, text) => {
    expect(formatDuration(us)).toBe(text)
  })

  it('unit ms: the same list from milliseconds', () => {
    expect(formatDuration(65_000, { unit: 'ms' })).toBe('1 m, 5 s')
  })

  it.each([
    [0, '0 ms'],
    [340, '340 ms'],
    [8400, '8.4 s'],
    [41_000, '41 s'],
    [252_000, '4 min 12 s'],
    [300_000, '5 min'],
    [7_500_000, '2 h 5 min'],
    [7_200_000, '2 h']
  ])('compact, ms: %s → %s', (ms, text) => {
    expect(formatDuration(ms, { unit: 'ms', style: 'compact' })).toBe(text)
  })

  it('compact from microseconds', () => {
    expect(formatDuration(8_400_000, { style: 'compact' })).toBe('8.4 s')
  })
})
