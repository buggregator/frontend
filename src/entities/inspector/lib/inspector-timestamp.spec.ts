import { describe, expect, it } from 'vitest'
import { inspectorTimestampToDate } from './inspector-timestamp'

describe('inspectorTimestampToDate', () => {
  it('reads Unix seconds with a fraction (inspector-php microtime(true))', () => {
    expect(inspectorTimestampToDate(1678366953.702228)?.toISOString()).toBe('2023-03-09T13:02:33.702Z')
  })

  it('reads whole Unix seconds', () => {
    expect(inspectorTimestampToDate(1791366000)?.toISOString()).toBe('2026-10-07T09:40:00.000Z')
  })

  it('keeps milliseconds as they are', () => {
    expect(inspectorTimestampToDate(1678366953702)?.toISOString()).toBe('2023-03-09T13:02:33.702Z')
  })

  it.each([0, -1, Number.NaN, undefined, null])('returns null for %s', (value) => {
    expect(inspectorTimestampToDate(value as number)).toBeNull()
  })
})
