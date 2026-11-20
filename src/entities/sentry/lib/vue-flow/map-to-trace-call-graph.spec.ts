import { describe, expect, it } from 'vitest'
import type { SentrySpan } from '../../types'
import {
  mapToTraceCallGraph,
  NODE_H,
  NODE_W,
  pathThrough,
  type TraceCallEdgeData,
  type TraceSpanNodeData
} from './map-to-trace-call-graph'

const span = (
  id: string,
  parent: string | null,
  service: string,
  start: number,
  duration: number,
  extra: Partial<SentrySpan> = {}
): SentrySpan => ({
  span_id: id,
  parent_span_id: parent,
  op: 'http.server',
  description: id.toUpperCase(),
  status: 'ok',
  start_offset_ms: start,
  duration_ms: duration,
  peer_type: null,
  peer_address: null,
  is_error: false,
  service_name: service,
  ...extra
})

// The #6529 stand trace: shop-web → checkout-api → payments-worker → payments.example.
const spans: SentrySpan[] = [
  span('root', null, 'shop-web', 0, 372, { source: 'sentry', is_error: true }),
  span('sel', 'root', 'shop-web', 10, 14, { op: 'db', peer_type: 'db', peer_address: 'sqlite' }),
  span('cli', 'root', 'shop-web', 30, 320, { op: 'http.client', is_error: true, peer_type: 'http', peer_address: 'checkout-api:8080' }),
  span('orders', 'cli', 'checkout-api', 33, 317, { source: 'otel', is_error: true }),
  span('create', 'orders', 'checkout-api', 33, 317, { op: 'internal' }),
  span('ins', 'create', 'checkout-api', 35, 17, { op: 'db' }),
  span('pay', 'create', 'checkout-api', 50, 300, { op: 'http.client', is_error: true }),
  span('charge', 'pay', 'payments-worker', 50, 900, { source: 'otel' }),
  span('ext', 'charge', 'payments-worker', 50, 900, {
    op: 'http.client',
    peer_type: 'http',
    peer_address: 'https://payments.example/charge'
  })
]

const { nodes, edges, clusters } = mapToTraceCallGraph(spans)
const pos = (id: string) => nodes.find((n) => n.id === id)!.position
const edge = (id: string) => edges.find((e) => e.id === id)!
const edgeData = (id: string) => edge(id).data as TraceCallEdgeData

describe('mapToTraceCallGraph layout (#6531)', () => {
  it('one column group per service, in call order, left to right', () => {
    expect(clusters.map((c) => c.service)).toEqual(['shop-web', 'checkout-api', 'payments-worker'])
    expect(clusters[0].source).toBe('Sentry SDK')
    expect(clusters[1].source).toBe('OTel')
    for (let i = 1; i < clusters.length; i++) {
      expect(clusters[i].x).toBeGreaterThan(clusters[i - 1].x + clusters[i - 1].width)
    }
  })

  it('a call inside a service goes one row down; into another service, right on the same row', () => {
    expect(pos('sel').y).toBeGreaterThan(pos('root').y)
    expect(pos('orders').y).toBe(pos('cli').y)
    expect(pos('orders').x).toBeGreaterThan(pos('cli').x)
    expect(pos('create').y).toBeGreaterThan(pos('orders').y)
  })

  it('siblings of one service on one row take separate sub-columns', () => {
    expect(pos('sel').y).toBe(pos('cli').y)
    expect(Math.abs(pos('sel').x - pos('cli').x)).toBeGreaterThanOrEqual(NODE_W)
  })

  it('every span sits inside its service box', () => {
    for (const n of nodes.filter((x) => x.type === 'traceSpan')) {
      const c = clusters.find((x) => x.service === (n.data as TraceSpanNodeData).service)!
      expect(n.position.x).toBeGreaterThanOrEqual(c.x)
      expect(n.position.x + NODE_W).toBeLessThanOrEqual(c.x + c.width)
      expect(n.position.y).toBeGreaterThanOrEqual(c.y)
      expect(n.position.y + NODE_H).toBeLessThanOrEqual(c.y + c.height)
    }
  })

  it('an HTTP call with nothing behind it ends in an external host under its caller', () => {
    const ext = nodes.find((n) => n.type === 'traceExternal')!
    expect(ext.data).toEqual({ host: 'payments.example' })
    expect(ext.position.x).toBe(pos('ext').x)
    expect(ext.position.y).toBeGreaterThan(pos('ext').y)
    expect(edgeData('ext->ext:ext')).toMatchObject({ label: '900 ms', labelSide: 'right' })
    // A db call or a call with a span behind it gets no external node.
    expect(nodes.filter((n) => n.type === 'traceExternal')).toHaveLength(1)
  })

  it('names each node for screen readers', () => {
    expect(nodes.find((n) => n.id === 'orders')!.ariaLabel).toBe('ORDERS, checkout-api, 317 ms, error')
  })
})

describe('mapToTraceCallGraph edges (#6531)', () => {
  it('inside a service: bottom to top, no label', () => {
    expect(edge('root->sel')).toMatchObject({ sourceHandle: 'b', targetHandle: 't', type: 'traceCall' })
    expect(edgeData('root->sel').label).toBeNull()
  })

  it('into another service: right to left, the caller time, red when the call failed', () => {
    expect(edge('cli->orders')).toMatchObject({ sourceHandle: 'r', targetHandle: 'l' })
    expect(edgeData('cli->orders')).toMatchObject({ crosses: true, failed: true, label: '320 ms · error', labelSide: 'above' })
  })

  it('an error inside one service does not paint its edges red', () => {
    expect(edgeData('root->sel').failed).toBe(false)
  })

  it('returns nothing for an empty trace', () => {
    expect(mapToTraceCallGraph([])).toEqual({ nodes: [], edges: [], clusters: [] })
  })
})

describe('pathThrough', () => {
  it('lights the callers up to the root and everything the node calls', () => {
    const path = pathThrough('pay', edges)
    expect([...path.nodes].sort()).toEqual(['charge', 'cli', 'create', 'ext', 'ext:ext', 'orders', 'pay', 'root'].sort())
    expect(path.edges.has('root->sel')).toBe(false)
    expect(path.edges.has('create->ins')).toBe(false)
    expect(path.edges.has('cli->orders')).toBe(true)
    expect(path.edges.has('charge->ext')).toBe(true)
  })
})
