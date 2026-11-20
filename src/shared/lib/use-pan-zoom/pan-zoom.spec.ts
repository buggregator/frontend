import { describe, expect, it } from 'vitest'
import { fitContent, zoomAt } from './pan-zoom'

const limits = { min: 0.2, max: 2 }

describe('fitContent', () => {
  it('shrinks wide content so every lane is in view, centred', () => {
    const t = fitContent({ width: 532, height: 600 }, { width: 1000, height: 300 }, limits)
    expect(t.k).toBeCloseTo(0.5)
    expect(t.x).toBeCloseTo(16)
    expect(t.y).toBeCloseTo((600 - 150) / 2)
  })

  it('never enlarges small content past 1', () => {
    expect(fitContent({ width: 2000, height: 1000 }, { width: 640, height: 200 }, limits).k).toBe(1)
  })

  it('fits a tall content by width at no less than half, starting at the top', () => {
    const t = fitContent({ width: 1032, height: 500 }, { width: 1000, height: 5000 }, limits)
    expect(t.k).toBeCloseTo(0.5)
    expect(t.y).toBe(16)
  })

  it('keeps the minimum zoom', () => {
    expect(fitContent({ width: 100, height: 100 }, { width: 10000, height: 100 }, limits).k).toBe(0.2)
  })

  it('returns identity for an empty box', () => {
    expect(fitContent({ width: 0, height: 0 }, { width: 100, height: 100 }, limits)).toEqual({ x: 0, y: 0, k: 1 })
  })
})

describe('zoomAt', () => {
  it('keeps the point under the pointer in place', () => {
    const t = { x: 10, y: 20, k: 1 }
    const next = zoomAt(t, 2, 110, 120, limits)
    // content point under (110, 120) was (100, 100); still there after zoom.
    expect((110 - next.x) / next.k).toBeCloseTo(100)
    expect((120 - next.y) / next.k).toBeCloseTo(100)
    expect(next.k).toBe(2)
  })

  it('clamps to the limits', () => {
    expect(zoomAt({ x: 0, y: 0, k: 1.9 }, 2, 0, 0, limits).k).toBe(2)
    expect(zoomAt({ x: 0, y: 0, k: 0.25 }, 0.5, 0, 0, limits).k).toBe(0.2)
  })
})
