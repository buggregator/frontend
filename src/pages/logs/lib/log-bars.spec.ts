import { describe, expect, it } from 'vitest'
import { toLogBars } from './log-bars'

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

  it('nothing without a reply', () => {
    expect(toLogBars(null, '1h', now)).toEqual([])
  })
})
