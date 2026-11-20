import { describe, expect, it } from 'vitest'
import type { SentryServiceMap } from '../../types'
import {
  bandWidth,
  boundsOf,
  buildServiceMap,
  emissionRate,
  formatMs,
  formatPercent,
  hotSpots,
  litPart,
  periodSeconds,
  resample,
  serviceCalls,
  travelSeconds
} from './service-map-model'

const edge = (source: string, target: string, count: number, errors = 0, p95: number | null = 100, op = 'http') => ({
  source,
  target,
  op_type: op,
  request_count: count,
  error_count: errors,
  error_rate: count ? errors / count : 0,
  avg_duration_ms: p95,
  p95_duration_ms: p95,
  trace_count: count,
  traces: []
})
const node = (id: string, count: number, errors = 0, kind = 'service') => ({
  id,
  label: id,
  kind,
  request_count: count,
  error_count: errors,
  avg_duration_ms: 50,
  p95_duration_ms: 100
})

// #6540 scenario: 1000 into shop-web over 15 min, 600 / 300 / 100 out.
const fanOut: SentryServiceMap = {
  from: '2026-11-20T18:00:00Z',
  to: '2026-11-20T18:15:00Z',
  window_minutes: 15,
  nodes: [
    node('shop-web', 1000, 20),
    node('catalog-api', 600, 3),
    node('checkout-api', 300, 18),
    node('auth-api', 100),
    node('payments-worker', 280, 50),
    node('postgres', 1500, 0, 'external')
  ],
  edges: [
    edge('shop-web', 'catalog-api', 600, 3, 120),
    edge('shop-web', 'checkout-api', 300, 18, 380),
    edge('shop-web', 'auth-api', 100, 0, 40),
    edge('checkout-api', 'payments-worker', 280, 50, 900),
    edge('catalog-api', 'postgres', 1200, 0, 18, 'db'),
    edge('checkout-api', 'postgres', 300, 0, 25, 'db')
  ]
}

describe('service map model', () => {
  it('reads the period from the server bounds, else from its window', () => {
    expect(periodSeconds(fanOut)).toBe(900)
    expect(periodSeconds({ nodes: [], edges: [], window_minutes: 60 })).toBe(3600)
  })

  it('follows the #6540 particle rules: density by rps (capped), speed by p95', () => {
    expect(emissionRate(1000, 100)).toBe(80)
    expect(emissionRate(600, 900)).toBeCloseTo(16)
    // A quiet line still moves.
    expect(emissionRate(3, 900)).toBe(1.2)
    expect(emissionRate(0, 900)).toBe(0)
    expect(travelSeconds(120)).toBeCloseTo(1.2)
    expect(travelSeconds(900)).toBeCloseTo(2.5)
    expect(travelSeconds(5000)).toBe(4)
    expect(travelSeconds(null)).toBe(1)
    expect(bandWidth(1000, 1000)).toBe(12)
    expect(bandWidth(0, 1000)).toBe(7.5)
  })

  it('lays the services out left to right, the entry service first with its clients band', () => {
    const m = buildServiceMap(fanOut)
    const x = (id: string) => m.nodes.find((n) => n.id === id)!.x
    expect(x('shop-web')).toBeLessThan(x('checkout-api'))
    expect(x('checkout-api')).toBeLessThan(x('payments-worker'))
    expect(m.entries).toHaveLength(1)
    expect(m.entries[0]).toMatchObject({ nodeId: 'shop-web', count: 1000 })
    for (const n of m.nodes) {
      expect(n.x).toBeGreaterThanOrEqual(0)
      expect(n.x + n.w).toBeLessThanOrEqual(m.width)
      expect(n.y + n.h).toBeLessThanOrEqual(m.height)
    }
  })

  it('gives each line its caller share, error state and a 64-point path', () => {
    const m = buildServiceMap(fanOut)
    const e = (s: string, t: string) => m.edges.find((x) => x.source === s && x.target === t)!
    expect(e('shop-web', 'catalog-api').share).toBeCloseTo(0.6)
    expect(e('shop-web', 'auth-api').share).toBeCloseTo(0.1)
    expect(e('checkout-api', 'payments-worker').isErr).toBe(true)
    expect(e('shop-web', 'catalog-api').isErr).toBe(false)
    const line = e('shop-web', 'catalog-api')
    expect(line.samples).toHaveLength(64)
    const s = m.nodes.find((n) => n.id === 'shop-web')!
    expect(line.samples[0].x).toBeCloseTo(s.x + s.w)
    expect(line.d.startsWith('M')).toBe(true)
  })

  it('tells a database from another external host and counts in/out', () => {
    const m = buildServiceMap(fanOut)
    const pg = m.nodes.find((n) => n.id === 'postgres')!
    expect(pg).toMatchObject({ external: true, kind: 'database', inCount: 1500 })
    const shop = m.nodes.find((n) => n.id === 'shop-web')!
    expect(shop).toMatchObject({ inCount: 1000, outCount: 1000 })
    expect(m.nodes.find((n) => n.id === 'payments-worker')!.hot).toBe(true)
  })

  it('#6549: a service\'s rate counts the same calls as «in N» beside it', () => {
    const m = buildServiceMap({ ...fanOut, nodes: [...fanOut.nodes.slice(0, 5), { ...node('postgres', 0, 0, 'external'), rpm: 0 }] })
    // 1500 calls in over 15 minutes, though the server counts 0 transactions there.
    expect(m.nodes.find((n) => n.id === 'postgres')).toMatchObject({ inCount: 1500, rpm: 100 })
  })

  it('marks the three hot spots', () => {
    const m = buildServiceMap(fanOut)
    const of = (k: string) => m.hotSpots.find((h) => h.kind === k)?.edgeId
    expect(of('busiest')).toBe('shop-web→catalog-api:http')
    expect(of('errors')).toBe('checkout-api→payments-worker:http')
    expect(of('slowest')).toBe('checkout-api→payments-worker:http')
  })

  it('needs 20 calls before a line is «most errors»', () => {
    const m = buildServiceMap({ ...fanOut, edges: [edge('a', 'b', 2, 1), edge('a', 'c', 40, 2)], nodes: [] })
    expect(hotSpots(m.edges, m.entries).find((h) => h.kind === 'errors')?.edgeId).toBe('a→c:http')
  })

  it('lights a service with its callers and callees, or a line with its ends', () => {
    const m = buildServiceMap(fanOut)
    const lit = litPart(m, { kind: 'node', id: 'checkout-api' })!
    expect([...lit.nodes].sort()).toEqual(['checkout-api', 'payments-worker', 'postgres', 'shop-web'])
    expect(lit.edges.has('shop-web→catalog-api:http')).toBe(false)
    const one = litPart(m, { kind: 'edge', id: 'shop-web→auth-api:http' })!
    expect([...one.nodes].sort()).toEqual(['auth-api', 'shop-web'])
    expect(litPart(m, null)).toBeNull()
    expect(litPart(m, { kind: 'node', id: 'gone' })).toBeNull()
  })

  it('lists Uses and Used for the drawer, biggest first', () => {
    const m = buildServiceMap(fanOut)
    const c = serviceCalls(m, 'checkout-api')
    expect(c.uses.map((r) => r.service)).toEqual(['postgres', 'payments-worker'])
    expect(c.used).toEqual([expect.objectContaining({ service: 'shop-web', count: 300, errors: 18 })])
    expect(serviceCalls(m, 'shop-web').entryCount).toBe(1000)
    expect(boundsOf(m, ['shop-web', 'auth-api'])!.w).toBeGreaterThan(0)
    expect(boundsOf(m, [])).toBeNull()
  })

  it('draws an edge to a node the server did not list as an external one', () => {
    const m = buildServiceMap({ window_minutes: 60, nodes: [node('a', 5)], edges: [edge('a', 'redis', 9, 0, 2, 'cache')] })
    expect(m.nodes.find((n) => n.id === 'redis')).toMatchObject({ external: true, kind: 'external' })
  })

  it('resamples a polyline evenly by length', () => {
    const pts = resample([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 30 }], 5)
    expect(pts.map((p) => [Math.round(p.x), Math.round(p.y)])).toEqual([[0, 0], [10, 0], [10, 10], [10, 20], [10, 30]])
  })

  it('formats numbers the way the labels show them', () => {
    expect(formatMs(1900)).toBe('1.9 s')
    expect(formatMs(380)).toBe('380 ms')
    expect(formatMs(null)).toBe('—')
    expect(formatPercent(0.6)).toBe('60%')
    expect(formatPercent(0.005)).toBe('0.5%')
  })
})
