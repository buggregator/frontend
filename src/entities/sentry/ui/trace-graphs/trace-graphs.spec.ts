import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { serviceColors } from '../../lib/trace-graph/trace-graph'
import type { SentrySpan } from '../../types'
import TraceInsight from './trace-insight.vue'
import TraceTimeBreakdown from './trace-time-breakdown.vue'

const span = (id: string, parent: string | null, service: string, start: number, duration: number, extra: Partial<SentrySpan> = {}): SentrySpan => ({
  span_id: id,
  parent_span_id: parent,
  op: 'http.server',
  description: id,
  status: 'ok',
  start_offset_ms: start,
  duration_ms: duration,
  peer_type: null,
  peer_address: null,
  is_error: false,
  service_name: service,
  ...extra
})

const spans = [
  span('root', null, 'shop-web', 0, 372),
  span('call', 'root', 'checkout-api', 30, 300, { is_error: true, op: 'http.client' }),
  span('charge', 'call', 'payments-worker', 50, 900)
]

describe('TraceTimeBreakdown (#6533)', () => {
  const render = (selectedSpanId: string | null = null) =>
    mount(TraceTimeBreakdown, { props: { spans, colors: serviceColors(spans), selectedSpanId } })

  it('lists services by self time', () => {
    const rows = render().findAll('[data-test="time-service"]').map((r) => r.text())
    expect(rows[0]).toContain('payments-worker')
    expect(rows[0]).toContain('900')
  })

  it('an operation is a button that selects its span', async () => {
    const w = render()
    await w.findAll('[data-test="time-operation"]')[0].trigger('click')
    expect(w.emitted('select')?.[0]).toEqual(['charge'])
  })

  it('shows the selected span and sends it to the waterfall', async () => {
    const w = render('call')
    expect(w.get('[data-test="time-selected"]').text()).toContain('error')
    await w.get('[data-test="time-show-in-waterfall"]').trigger('click')
    expect(w.emitted('show-in-waterfall')?.[0]).toEqual(['call'])
  })
})

describe('TraceInsight (#6533)', () => {
  it('says which service kept working after its caller gave up', () => {
    const text = mount(TraceInsight, { props: { spans } }).text()
    expect(text).toContain('payments-worker kept working 620 ms after checkout-api gave up.')
    expect(text).toContain('checkout-api waited 300 ms and failed')
  })

  it('renders nothing without such a call', () => {
    expect(mount(TraceInsight, { props: { spans: spans.slice(0, 1) } }).find('[data-test="trace-insight"]').exists()).toBe(false)
  })
})
