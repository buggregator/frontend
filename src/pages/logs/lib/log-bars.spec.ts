import { describe, expect, it } from 'vitest'
import { bucketTotal } from '@/shared/ui/bar-histogram'
import { barsLabel, toLogBars } from './log-bars'

describe('toLogBars', () => {
  const now = 1_000_000_020 // 20 s into a minute

  it('fills the whole hour with empty minutes, error and worse as errors', () => {
    const minute = Math.floor(now / 60) * 60
    const bars = toLogBars(
      {
        bucket: 60,
        data: [
          { t: minute - 120, count: 10, levels: { error: 2, critical: 1, warning: 3, info: 4 } }
        ]
      },
      '1h',
      now
    )
    expect(bars).toHaveLength(60)
    expect(bars[bars.length - 1].t).toBe(minute)
    expect(bars[57]).toEqual({ t: minute - 120, values: { error: 3, warning: 3, other: 4 } })
    expect(bars[0].values).toEqual({})
  })

  it('uses the bucket the server answered with', () => {
    const bars = toLogBars({ bucket: 1800, data: [] }, '30d', now)
    expect(bars[1].t - bars[0].t).toBe(1800)
    expect(bars).toHaveLength(1440)
  })

  it('all time starts at the first line', () => {
    const first = Math.floor((now - 600) / 60) * 60
    const bars = toLogBars({ bucket: 60, data: [{ t: first, count: 1 }] }, 'all', now)
    expect(bars[0]).toEqual({ t: first, values: { error: 0, warning: 0, other: 1 } })
    expect(bars).toHaveLength(11)
  })

  it('all time older than a day widens the bars so the old lines stay on the chart', () => {
    const day = 24 * 3600
    const bars = toLogBars(
      {
        bucket: 60,
        data: [
          { t: now - 26 * 3600, count: 5, levels: { info: 5 } },
          { t: now - day, count: 3, levels: { error: 3 } }
        ]
      },
      'all',
      now
    )
    expect(bars.length).toBeLessThanOrEqual(1440)
    expect(bars.reduce((sum, b) => sum + bucketTotal(b), 0)).toBe(8)
    expect((bars[1].t - bars[0].t) % 60).toBe(0)
  })

  it('names the bar width for screen readers', () => {
    expect(barsLabel([{ t: 0, values: {} }, { t: 60, values: {} }])).toBe('Log lines per minute')
    expect(barsLabel([{ t: 0, values: {} }, { t: 420, values: {} }])).toBe('Log lines per 7 minutes')
    expect(barsLabel([{ t: 0, values: {} }, { t: 3600, values: {} }])).toBe('Log lines per hour')
    expect(barsLabel([{ t: 0, values: {} }, { t: 7200, values: {} }])).toBe('Log lines per 2 hours')
    expect(barsLabel([{ t: 0, values: {} }, { t: 30, values: {} }])).toBe('Log lines per 30 seconds')
    expect(barsLabel([])).toBe('Log lines over time')
  })

  it('nothing without a reply', () => {
    expect(toLogBars(null, '1h', now)).toEqual([])
  })
})
