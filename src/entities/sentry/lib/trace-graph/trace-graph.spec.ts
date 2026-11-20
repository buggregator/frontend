import { describe, expect, it } from 'vitest'
import type { SentrySpan } from '../../types'
import {
  buildSpanTree,
  selfTimes,
  serviceColors,
  timeByOperation,
  timeByService,
  toFlameNodes,
  overrunText, traceInsight
} from './trace-graph'

const span = (
  id: string,
  parent: string | null,
  service: string,
  description: string,
  start: number,
  duration: number,
  extra: Partial<SentrySpan> = {}
): SentrySpan => ({
  span_id: id,
  parent_span_id: parent,
  op: 'http.server',
  description,
  status: 'ok',
  start_offset_ms: start,
  duration_ms: duration,
  peer_type: null,
  peer_address: null,
  is_error: false,
  service_name: service,
  ...extra
})

// shop-web (Sentry SDK) → checkout-api (OTel) → payments-worker (OTel), as on the #6529 stand.
const checkout: SentrySpan[] = [
  span('root', null, 'shop-web', 'POST /cart/checkout', 0, 372, { is_error: true }),
  span('sel', 'root', 'shop-web', 'SELECT cart_items', 10, 14, { op: 'db' }),
  span('cli', 'root', 'shop-web', 'POST checkout-api/orders', 30, 320, { op: 'http.client', is_error: true }),
  span('orders', 'cli', 'checkout-api', 'POST /orders', 33, 317, { is_transaction: true, is_error: true }),
  span('create', 'orders', 'checkout-api', 'orders.Create', 33, 317, { op: 'internal' }),
  span('ins', 'create', 'checkout-api', 'INSERT orders', 35, 17, { op: 'db' }),
  span('pay', 'create', 'checkout-api', 'HTTP POST', 50, 300, { op: 'http.client', is_error: true }),
  span('charge', 'pay', 'payments-worker', 'POST /charge', 50, 900, { is_transaction: true }),
  span('pcharge', 'charge', 'payments-worker', 'payments.Charge', 50, 900, { op: 'internal' }),
  span('ext', 'pcharge', 'payments-worker', 'POST payments.example/charge', 50, 900, { op: 'http.client' })
]

describe('buildSpanTree', () => {
  it('nests spans under their parents, ordered by start', () => {
    const roots = buildSpanTree(checkout)
    expect(roots.map((n) => n.span.span_id)).toEqual(['root'])
    expect(roots[0].children.map((n) => n.span.span_id)).toEqual(['sel', 'cli'])
  })

  it('treats a span whose parent is missing as a root', () => {
    const roots = buildSpanTree([span('a', 'gone', 'x', 'A', 5, 1), span('b', null, 'x', 'B', 0, 1)])
    expect(roots.map((n) => n.span.span_id)).toEqual(['b', 'a'])
  })
})

describe('selfTimes', () => {
  it('subtracts the time covered by children, clipped to the parent', () => {
    const self = selfTimes(checkout)
    expect(self.get('root')).toBe(38)
    expect(self.get('cli')).toBe(3)
    // The child runs past its parent: only the overlap counts.
    expect(self.get('pay')).toBe(0)
    expect(self.get('ext')).toBe(900)
  })

  it('counts overlapping children once', () => {
    const self = selfTimes([
      span('p', null, 'x', 'P', 0, 100),
      span('c1', 'p', 'x', 'C1', 10, 50),
      span('c2', 'p', 'x', 'C2', 40, 30)
    ])
    expect(self.get('p')).toBe(40)
  })
})

describe('timeByService / timeByOperation', () => {
  it('sums self time per service, largest first, with percents', () => {
    const rows = timeByService(checkout)
    expect(rows.map((r) => r.name)).toEqual(['payments-worker', 'shop-web', 'checkout-api'])
    expect(rows[0].ms).toBe(900)
    expect(rows.reduce((a, r) => a + r.percent, 0)).toBeCloseTo(100, 0)
  })

  it('lists operations by self time with the span to select', () => {
    const rows = timeByOperation(checkout, 3)
    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({ name: 'POST payments.example/charge', ms: 900, spanId: 'ext' })
  })

  it('groups spans without a service under «unknown»', () => {
    const rows = timeByService([span('a', null, '', 'A', 0, 10, { service_name: null })])
    expect(rows[0].name).toBe('unknown')
  })
})

describe('serviceColors', () => {
  it('gives each service its own color in order of appearance', () => {
    const colors = serviceColors(checkout)
    expect([...colors.keys()]).toEqual(['shop-web', 'checkout-api', 'payments-worker'])
    expect(new Set(colors.values()).size).toBe(3)
  })
})

describe('toFlameNodes', () => {
  it('maps the span tree to flame-chart nodes colored by service', () => {
    const colors = serviceColors(checkout)
    const [root] = toFlameNodes(checkout, colors)
    expect(root).toMatchObject({ name: 'POST /cart/checkout 372 ms', start: 0, duration: 372 })
    expect(root.color).toBe(colors.get('shop-web'))
    expect(root.children?.[1].children?.[0].color).toBe(colors.get('checkout-api'))
  })

  it('marks error spans with a badge and keeps the span id', () => {
    const [root] = toFlameNodes(checkout, serviceColors(checkout))
    expect(root.badge).toBeTruthy()
    expect(root.type).toBe('root')
    expect(root.children?.[0].badge).toBeUndefined()
  })
})

describe('traceInsight', () => {
  it('names the service that kept working after its caller gave up', () => {
    expect(traceInsight(checkout)).toEqual({
      service: 'payments-worker',
      caller: 'checkout-api',
      overrunMs: 600,
      callerWaitedMs: 300,
      callerFailed: true,
      calleeMs: 900,
      spanId: 'charge',
      callerSpanId: 'pay'
    })
  })

  it('is null when no service outlives its caller', () => {
    expect(traceInsight(checkout.slice(0, 6))).toBeNull()
  })

  it('reviewer #361: a few ms past a successful caller is no insight (PHP ends after the response)', () => {
    expect(
      traceInsight([span('p', null, 'web', 'GET /x', 0, 300), span('c', 'p', 'api', 'GET /y', 10, 300)])
    ).toBeNull()
  })

  it('reviewer #361: a long overrun of a caller that did not fail is «stopped waiting»', () => {
    const i = traceInsight([span('p', null, 'web', 'GET /x', 0, 300), span('c', 'p', 'api', 'GET /y', 10, 500)])
    expect(i).toMatchObject({ overrunMs: 210, callerFailed: false })
    expect(overrunText(i!.service, i!.caller, '210 ms', i!.callerFailed)).toBe(
      'api kept working 210 ms after web stopped waiting'
    )
  })

  it('ignores overruns inside one service', () => {
    expect(
      traceInsight([span('p', null, 'x', 'P', 0, 10), span('c', 'p', 'x', 'C', 0, 500)])
    ).toBeNull()
  })
})
