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

vi.mock('../../lib', () => ({
  useSentryRequests: () => ({ getTraceSequence: () => Promise.resolve(seq) })
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
})
