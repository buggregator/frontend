import { describe, expect, it } from 'vitest'
import type { SentryFlow, SentrySequence } from '../../types'
import { layoutFlow, layoutSequence } from './flow-layout'

const at = (min: number, ms = 0) => new Date(Date.UTC(2026, 10, 20, 17, 30 + min, 0, ms)).toISOString()

const flow: SentryFlow = {
  from: at(0),
  to: at(10),
  bucket_seconds: 60,
  total: 2,
  truncated: false,
  services: ['shop-web', 'checkout-api', 'payments-worker'],
  buckets: Array.from({ length: 10 }, (_, i) => ({ t: at(i), count: i === 5 ? 2 : 0, errors: i === 5 ? 1 : 0 })),
  requests: [
    {
      trace_id: 't2',
      name: 'POST /cart/checkout',
      start_ts: at(5),
      end_ts: at(5, 900),
      duration_ms: 900,
      is_error: true,
      services: [
        { service: 'payments-worker', start_ts: at(5), end_ts: at(5, 900), is_error: false },
        { service: 'shop-web', start_ts: at(5), end_ts: at(5, 372), is_error: true },
        { service: 'checkout-api', start_ts: at(5), end_ts: at(5, 350), is_error: true }
      ]
    },
    {
      trace_id: 't1',
      name: 'GET /orders/1',
      start_ts: at(2),
      end_ts: at(2, 9),
      duration_ms: 9,
      is_error: false,
      services: [{ service: 'checkout-api', start_ts: at(2), end_ts: at(2, 9), is_error: false }]
    }
  ]
}

describe('layoutFlow (#6533 C)', () => {
  const l = layoutFlow(flow, { width: 1150, left: 150, right: 0, top: 20, laneHeight: 60 })

  it('lanes in the caller-first order the server gives, 60 px apart', () => {
    expect(l.lanes).toEqual([
      { service: 'shop-web', y: 20 },
      { service: 'checkout-api', y: 80 },
      { service: 'payments-worker', y: 140 }
    ])
  })

  it('places a request at its start time on the plot', () => {
    expect(l.strokes[0].x).toBe(650)
    expect(l.strokes[1].x).toBe(350)
  })

  it('a stroke runs down from lane to lane, whatever order the services came in', () => {
    expect(l.strokes[0].segments).toEqual([
      { y1: 20, y2: 80 },
      { y1: 80, y2: 140 }
    ])
    expect(l.strokes[0].isError).toBe(true)
  })

  it('a request in one service is a dot without segments', () => {
    expect(l.strokes[1].segments).toEqual([])
    expect(l.strokes[1].dots).toEqual([80])
  })

  it('a service missing from the order gets a lane at the bottom', () => {
    const extra = layoutFlow(
      { ...flow, services: ['shop-web'], requests: flow.requests.slice(1) },
      { width: 1150, top: 20 }
    )
    expect(extra.lanes.map((x) => x.service)).toEqual(['shop-web', 'checkout-api'])
  })

  it('one bar per bucket, as wide as the bucket', () => {
    expect(l.bars).toHaveLength(10)
    expect(l.bars[5]).toMatchObject({ x: 651, width: 98, count: 2, errors: 1 })
  })

  it('time ticks at a round step, at most 10', () => {
    expect(l.ticks.length).toBeGreaterThan(4)
    expect(l.ticks.length).toBeLessThanOrEqual(11)
    expect(l.ticks[0].x).toBe(150)
  })
})

const seq: SentrySequence = {
  trace_id: 't2',
  services: ['shop-web', 'checkout-api', 'payments-worker'],
  calls: [
    {
      span_id: 'a',
      from: 'shop-web',
      to: 'checkout-api',
      op_type: 'http',
      description: 'POST /orders',
      start_ts: at(0, 30),
      end_ts: at(0, 350),
      duration_ms: 320,
      is_error: true,
      status: 'deadline_exceeded',
      callee: { service: 'checkout-api', start_ts: at(0, 33), end_ts: at(0, 350), duration_ms: 317, is_error: true, transaction_id: 'x' },
      late_ms: 0
    },
    {
      span_id: 'b',
      from: 'checkout-api',
      to: 'payments-worker',
      op_type: 'http',
      description: 'POST /charge',
      start_ts: at(0, 50),
      end_ts: at(0, 350),
      duration_ms: 300,
      is_error: true,
      status: 'timeout',
      callee: { service: 'payments-worker', start_ts: at(0, 50), end_ts: at(0, 950), duration_ms: 900, is_error: false, transaction_id: 'y' },
      late_ms: 600
    },
    {
      span_id: 'c',
      from: 'payments-worker',
      to: 'payments.example',
      op_type: 'http',
      description: 'POST /charge',
      start_ts: at(0, 50),
      end_ts: at(0, 950),
      duration_ms: 900,
      is_error: false,
      status: 'ok',
      callee: null,
      late_ms: 0
    }
  ]
}

describe('layoutSequence (#6533 C)', () => {
  const l = layoutSequence(seq, { width: 900, top: 50, row: 40, side: 90 })

  it('one lifeline per service, the external host last, spread across the width', () => {
    expect(l.lifelines.map((x) => x.service)).toEqual(['shop-web', 'checkout-api', 'payments-worker', 'payments.example'])
    expect(l.lifelines[0].x).toBe(90)
    expect(l.lifelines[3].x).toBe(810)
  })

  it('calls and replies in time order; the inner reply before its caller’s', () => {
    expect(l.arrows.map((a) => `${a.kind}:${a.label}`)).toEqual([
      'call:POST /orders · 320 ms · deadline_exceeded',
      'call:POST /charge · 300 ms · timeout',
      'call:POST /charge · 900 ms',
      'reply:timeout',
      'reply:deadline_exceeded',
      'reply:ok',
      'reply:ok (too late, +600 ms)'
    ])
    expect(l.arrows.map((a) => a.y)).toEqual([50, 90, 130, 170, 210, 250, 290])
  })

  it('a reply goes back from callee to caller', () => {
    const reply = l.arrows[3]
    expect(reply.fromX).toBeGreaterThan(reply.toX)
    expect(reply.isError).toBe(true)
  })

  it('the callee is active from the call to its last reply, the late one included', () => {
    const pw = l.activations[1]
    expect(pw).toMatchObject({ service: 'payments-worker', y1: 90, y2: 290 })
  })

  it('notes a callee that kept working after its caller gave up', () => {
    expect(l.notes).toHaveLength(1)
    expect(l.notes[0].text).toBe('payments-worker kept working +600 ms after checkout-api gave up')
  })

  it('no late reply or note when the callee finished in time (late_ms ≤ 0 or null)', () => {
    const inTime = layoutSequence(
      { ...seq, calls: [{ ...seq.calls[1], late_ms: -1 }, { ...seq.calls[2], late_ms: null }] },
      { width: 900 }
    )
    expect(inTime.notes).toEqual([])
    expect(inTime.arrows.filter((a) => a.late)).toEqual([])
  })
})
