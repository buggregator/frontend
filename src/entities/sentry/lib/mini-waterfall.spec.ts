import { describe, expect, it } from 'vitest'
import { barGeometry, waterfallScale } from './mini-waterfall'

const span = (start_offset_ms: number, duration_ms: number) => ({ start_offset_ms, duration_ms })

describe('waterfallScale', () => {
  it('is the trace duration when every span fits', () => {
    expect(waterfallScale([span(0, 50), span(100, 80)], 200)).toBe(200)
  })

  // frontend#390: a span of async work ends after the root request
  it('stretches to the latest span end', () => {
    expect(waterfallScale([span(0, 50), span(520, 8)], 200)).toBe(528)
  })

  it('falls back to the spans when the trace has no duration', () => {
    expect(waterfallScale([span(10, 30)], 0)).toBe(40)
    expect(waterfallScale([span(10, 30)], Number.NaN)).toBe(40)
  })

  it('is 0 when nothing has a length', () => {
    expect(waterfallScale([], 0)).toBe(0)
    expect(waterfallScale([span(Number.NaN, Number.NaN)], 0)).toBe(0)
  })
})

describe('barGeometry', () => {
  it('places a bar in percent of the scale', () => {
    expect(barGeometry(span(50, 25), 200)).toEqual({ left: 25, width: 12.5 })
  })

  it('never leaves the track', () => {
    expect(barGeometry(span(520, 8), 200)).toEqual({ left: 100, width: 0 })
    expect(barGeometry(span(-10, 500), 200)).toEqual({ left: 0, width: 100 })
    expect(barGeometry(span(190, 50), 200)).toEqual({ left: 95, width: 5 })
  })

  it('keeps a tiny span visible', () => {
    expect(barGeometry(span(0, 0), 1000)).toEqual({ left: 0, width: 1 })
  })

  it('has no geometry without a scale or with broken numbers', () => {
    expect(barGeometry(span(0, 10), 0)).toBeNull()
    expect(barGeometry(span(Number.NaN, 10), 100)).toEqual({ left: 0, width: 10 })
  })
})
