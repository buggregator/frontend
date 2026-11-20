import { describe, expect, it } from 'vitest'
import type { SentrySequence } from '../../types'
import { layoutSequence } from './sequence-layout'

const at = (min: number, ms = 0) => new Date(Date.UTC(2026, 10, 20, 17, 30 + min, 0, ms)).toISOString()

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

  it('reviewer #361: the note on the rightmost lane reads leftwards', () => {
    const last = layoutSequence({ ...seq, services: ['shop-web', 'payments-worker', 'checkout-api'] }, { width: 900 })
    expect(last.notes[0]).toMatchObject({ anchor: 'start' })
    expect(layoutSequence({ ...seq, calls: [seq.calls[1]] }, { width: 900 }).notes[0].anchor).toBe('end')
  })

  it('reviewer #361: a short overrun is no note; a successful caller «stopped waiting»', () => {
    const short = layoutSequence({ ...seq, calls: [{ ...seq.calls[1], late_ms: 5 }] }, { width: 900 })
    expect(short.notes).toEqual([])
    const ok = layoutSequence({ ...seq, calls: [{ ...seq.calls[1], is_error: false }] }, { width: 900 })
    expect(ok.notes[0].text).toBe('payments-worker kept working +600 ms after checkout-api stopped waiting')
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
