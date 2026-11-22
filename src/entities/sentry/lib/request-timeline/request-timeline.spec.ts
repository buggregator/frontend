import { describe, expect, it } from 'vitest'
import type { SentrySpan, SentryTraceDetail } from '../../types'
import { buildRequestTimeline, GROUP_MIN, spanLane, timelineSummary } from './request-timeline'

const span = (id: string, over: Partial<SentrySpan> = {}): SentrySpan => ({
  span_id: id,
  parent_span_id: 'root',
  op: 'function',
  description: id,
  status: 'ok',
  start_offset_ms: 0,
  duration_ms: 1,
  peer_type: null,
  peer_address: null,
  is_error: false,
  ...over
})

const detail = (spans: SentrySpan[], over: Partial<SentryTraceDetail> = {}): SentryTraceDetail => ({
  trace_id: 't1',
  transaction: {
    id: 'tx1',
    transaction_name: 'POST /cart/checkout',
    op: 'http.server',
    status: 'internal_error',
    start_ts: '2026-11-22T10:00:00.000Z',
    end_ts: '2026-11-22T10:00:00.372Z',
    duration_ms: 372,
    span_id: 'root'
  },
  spans,
  related_errors: [],
  related_log_count: 0,
  ...over
})

const query = (id: string, at: number, text = 'select * from products where id = ?') =>
  span(id, { op: 'db.sql.query', peer_type: 'db', description: text, start_offset_ms: at, duration_ms: 3 })

describe('spanLane', () => {
  it.each([
    [{ is_transaction: true }, 'request'],
    [{ peer_type: 'db' }, 'db'],
    [{ op: 'db.sql.query' }, 'db'],
    [{ op: 'cache.get' }, 'cache'],
    [{ peer_type: 'http' }, 'http'],
    [{ op: 'http.client' }, 'http'],
    [{ op: 'queue.publish' }, 'jobs'],
    [{ op: 'view.render' }, 'view'],
    [{ op: 'mail.send' }, 'mail'],
    [{ op: 'middleware.handle' }, 'other']
  ] as [Partial<SentrySpan>, string][])('%o → %s', (over, lane) => {
    expect(spanLane(span('s', over))).toBe(lane)
  })
})

describe('buildRequestTimeline', () => {
  it('puts the request root in its own lane, with the transaction time as the scale', () => {
    const t = buildRequestTimeline(detail([query('q1', 4)]))
    expect(t.totalMs).toBe(372)
    expect(t.lanes.map((l) => l.lane)).toEqual(['request', 'db'])
    expect(t.lanes[0].items[0]).toMatchObject({ kind: 'span', label: 'POST /cart/checkout', isError: true })
  })

  it('folds the server N+1 group into one block with its count and total time', () => {
    const ids = Array.from({ length: 30 }, (_, i) => `n${i}`)
    const spans = [query('q0', 4, 'select * from carts where id = ?'), ...ids.map((id, i) => query(id, 30 + i * 4))]
    const t = buildRequestTimeline(
      detail(spans, {
        n_plus_one: [
          { transaction_id: 'tx1', query: 'select * from products where id = ?', count: 30, total_ms: 118.4, origin: 'PriceCalculator.php:31', span_ids: ids }
        ]
      })
    )
    const db = t.lanes.find((l) => l.lane === 'db')!
    expect(db.count).toBe(31)
    expect(db.items).toHaveLength(2)
    const group = db.items.find((i) => i.kind === 'group')!
    expect(group).toMatchObject({ count: 30, totalMs: 118.4, startMs: 30, durationMs: 29 * 4 + 3 })
    expect(group.kind === 'group' && group.nPlusOne?.origin).toBe('PriceCalculator.php:31')
  })

  it(`groups any other run of ${GROUP_MIN}+ identical spans of one parent, and leaves shorter runs alone`, () => {
    const reads = Array.from({ length: GROUP_MIN }, (_, i) => span(`c${i}`, { op: 'cache.get', description: 'cart:1', start_offset_ms: i }))
    const few = Array.from({ length: GROUP_MIN - 1 }, (_, i) => span(`h${i}`, { op: 'http.client', description: 'GET /x', start_offset_ms: i }))
    const t = buildRequestTimeline(detail([...reads, ...few]))
    expect(t.lanes.find((l) => l.lane === 'cache')!.items).toHaveLength(1)
    expect(t.lanes.find((l) => l.lane === 'http')!.items).toHaveLength(GROUP_MIN - 1)
  })

  it('places markers by time, clamped to the scale, and orders the list by start', () => {
    const t = buildRequestTimeline(detail([query('q1', 50)]), [
      { id: 'm1', lane: 'logs', atMs: 362, label: 'OrderFailed', tone: 'error' },
      { id: 'm2', lane: 'mail', atMs: 900, label: 'OpsAlert' },
      { id: 'm3', lane: 'dumps', atMs: -5, label: 'POST /hook' }
    ])
    expect(t.list.map((i) => i.label)).toEqual(['POST /cart/checkout', 'POST /hook', 'select * from products where id = ?', 'OrderFailed', 'OpsAlert'])
    expect(t.list.find((i) => i.label === 'OpsAlert')!.startMs).toBe(372)
    expect(t.list.find((i) => i.label === 'POST /hook')!.startMs).toBe(0)
    expect(t.lanes.map((l) => l.lane)).toEqual(['request', 'db', 'logs', 'dumps', 'mail'])
  })
})

describe('timelineSummary', () => {
  it('counts each lane, query time included, and marks failures', () => {
    const t = buildRequestTimeline(
      detail([query('q1', 0), query('q2', 5), span('h', { op: 'http.client', is_error: true, description: 'POST /orders' })]),
      [{ id: 'e', lane: 'events', atMs: 1, label: 'OrderFailedException', tone: 'error' }]
    )
    expect(timelineSummary(t)).toEqual([
      { lane: 'db', text: '2 queries · 6 ms' },
      { lane: 'http', text: '1 outgoing call · 1 failed', tone: 'error' },
      { lane: 'events', text: '1 error', tone: 'error' }
    ])
  })
})
