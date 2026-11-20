import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { SentrySequence } from '../../types'
import TraceSequence from './trace-sequence.vue'

const at = (ms: number) => new Date(Date.UTC(2026, 10, 20, 17, 30, 0, ms)).toISOString()
const call = (span_id: string, from: string, to: string) => ({
  span_id,
  from,
  to,
  op_type: 'http',
  description: `GET /${to}`,
  start_ts: at(10),
  end_ts: at(90),
  duration_ms: 80,
  is_error: false,
  status: 'ok',
  callee: null,
  late_ms: 0
})
const seq = {
  trace_id: 't1',
  services: ['shop-web', 'checkout-api', 'payments-worker'],
  calls: [call('a', 'shop-web', 'checkout-api'), call('b', 'checkout-api', 'payments-worker')]
} as unknown as SentrySequence

let current: SentrySequence = seq
vi.mock('../../lib', () => ({
  useSentryRequests: () => ({ getTraceSequence: () => Promise.resolve(current) })
}))

describe('TraceSequence zoom (#6533 seq-zoom)', () => {
  it('zooms with the buttons and the keyboard, fits back with 0', async () => {
    const w = mount(TraceSequence, { props: { traceId: 't1', colors: new Map() } })
    await flushPromises()
    const value = () => w.get('[data-test="seq-zoom-value"]').text()
    const start = value()

    await w.get('[data-test="seq-zoom-in"]').trigger('click')
    expect(value()).toBe(`${Math.round(parseInt(start) * 1.2)}%`)
    expect(w.get('[data-test="seq-view"]').attributes('transform')).toContain('scale(1.2')

    await w.get('[data-test="seq-canvas"]').trigger('keydown', { key: '-' })
    expect(value()).toBe(start)

    await w.get('[data-test="seq-canvas"]').trigger('keydown', { key: '+' })
    await w.get('[data-test="seq-zoom-fit"]').trigger('click')
    expect(value()).toBe(start)
  })

  it('draws every lane inside the diagram', async () => {
    const w = mount(TraceSequence, { props: { traceId: 't1', colors: new Map() } })
    await flushPromises()
    expect(w.findAll('.trace-seq__lifeline')).toHaveLength(3)
  })

  it('#6549: a call inside one service is a loop, not a zero-length line', async () => {
    current = { ...seq, calls: [call('a', 'shop-web', 'shop-web')] } as unknown as SentrySequence
    const w = mount(TraceSequence, { props: { traceId: 't1', colors: new Map() } })
    await flushPromises()
    expect(w.findAll('path.trace-seq__arrow')).toHaveLength(2)
    expect(w.get('[data-test="seq-view"]').findAll('line.trace-seq__arrow')).toHaveLength(0)
    current = seq
  })

  it('#6549: a huge trace draws the first 300 calls and says so', async () => {
    current = {
      ...seq,
      calls: Array.from({ length: 450 }, (_, i) => call(`s${i}`, 'shop-web', 'checkout-api'))
    } as unknown as SentrySequence
    const w = mount(TraceSequence, { props: { traceId: 't1', colors: new Map() } })
    await flushPromises()
    expect(w.get('[data-test="seq-capped"]').text()).toContain('first 300 of 450 calls')
    expect(w.findAll('.trace-seq__arrow--call')).toHaveLength(300)
    current = seq
  })
})
