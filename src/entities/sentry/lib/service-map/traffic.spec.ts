import { describe, expect, it } from 'vitest'
import { createTraffic, placeOn } from './traffic'

describe('map traffic particles', () => {
  it('emits at the line rate and drops a particle at the far end', () => {
    const tr = createTraffic([{ id: 'a', rate: 10, travel: 2, errorRate: 0 }])
    for (let i = 0; i < 100; i++) tr.step(0.01)
    // 1 s at 10/s, none arrived yet (travel 2 s).
    expect(tr.particles()).toHaveLength(10)
    for (let i = 0; i < 200; i++) tr.step(0.01)
    // Steady state: rate × travel on the line.
    expect(tr.particles().length).toBeGreaterThanOrEqual(19)
    expect(tr.particles().length).toBeLessThanOrEqual(21)
    expect(tr.particles().every((p) => p.t >= 0 && p.t <= 1)).toBe(true)
  })

  it('paints exactly the failed share red', () => {
    const tr = createTraffic([{ id: 'a', rate: 50, travel: 4, errorRate: 0.18 }])
    tr.fill()
    const list = tr.particles()
    const red = list.filter((p) => p.err).length
    expect(list).toHaveLength(200)
    expect(red).toBe(36)
  })

  it('starts a line already in motion and restarts after a long gap', () => {
    const tr = createTraffic([{ id: 'a', rate: 4, travel: 2.5, errorRate: 0 }])
    tr.fill()
    expect(tr.particles()).toHaveLength(10)
    tr.step(30)
    expect(tr.particles()).toHaveLength(10)
  })

  it('gives the same jitter on every run', () => {
    const run = () => {
      const tr = createTraffic([{ id: 'x', rate: 5, travel: 1, errorRate: 0.5 }])
      tr.fill()
      return tr.particles().map((p) => [p.j, p.err])
    }
    expect(run()).toEqual(run())
    expect(run().every(([j]) => (j as number) >= -0.5 && (j as number) <= 0.5)).toBe(true)
  })

  it('places a particle along the line and sideways within the band', () => {
    const line = [{ x: 0, y: 0 }, { x: 100, y: 0 }]
    expect(placeOn(line, 0.5, 0, 10)).toEqual({ x: 50, y: 0 })
    const side = placeOn(line, 0.5, 0.5, 11)
    expect(side.x).toBe(50)
    expect(Math.abs(side.y)).toBe(4)
    expect(placeOn(line, 2, 0, 10)).toEqual({ x: 100, y: 0 })
  })
})
