import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SentrySpan } from '../../types'
import TraceWaterfall from './trace-waterfall.vue'

const span = (over: Partial<SentrySpan>): SentrySpan => ({
  span_id: 's1',
  parent_span_id: null,
  op: 'http.server',
  description: 'POST /cart/checkout',
  status: 'ok',
  start_offset_ms: 0,
  duration_ms: 412,
  peer_type: null,
  peer_address: null,
  is_error: false,
  ...over
})

const otelSpan = span({
  span_id: 's2',
  parent_span_id: 's1',
  op: 'http.client',
  description: 'POST payments.example/charge',
  source: 'otel',
  service_name: 'checkout-api',
  is_error: true,
  start_offset_ms: 66,
  duration_ms: 300,
  attributes: {
    'http.request.method': 'POST',
    'otel.status_code': 'ERROR',
    'otel.kind': 'client',
    'otel.resource': { 'service.name': 'checkout-api', 'service.version': '1.8.2', a: 1, b: 2, c: 3 },
    'otel.events': [
      {
        name: 'exception',
        time: '2026-11-20T10:00:00.3Z',
        attributes: {
          'exception.type': 'context.deadlineExceededError',
          'exception.message': 'context deadline exceeded',
          'exception.stacktrace': 'main.(*PaymentsClient).Charge'
        }
      }
    ],
    'otel.links': []
  }
})

// SpanDetails is an async component: let its import resolve.
const opened = async (w: { find: (s: string) => { exists: () => boolean } }) => {
  await vi.waitFor(() => expect(w.find('[data-test="span-details"]').exists()).toBe(true))
  await flushPromises()
}

const render = (spans: SentrySpan[]) =>
  mount(TraceWaterfall, { props: { spans, totalMs: 412, traceId: 'trace-1' }, attachTo: document.body })

describe('TraceWaterfall with OpenTelemetry spans (#6523)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('a Service column once any span knows its service', () => {
    const w = render([span({ service_name: 'shop-web', source: 'sentry' }), otelSpan])
    expect(w.findAll('[data-test="wf-service"]').map((c) => c.text())).toEqual(['shop-web', 'checkout-api'])
  })

  it('no Service column for an older server without service names', () => {
    expect(render([span({})]).find('[data-test="wf-service"]').exists()).toBe(false)
  })

  it('opens a span with Enter: the exception first, OTel tabs with counts', async () => {
    const w = render([span({}), otelSpan])
    const label = w.findAll('[data-test="wf-label"]')[1]
    await label.trigger('keydown', { key: 'Enter' })
    await opened(w)

    expect(label.attributes('aria-expanded')).toBe('true')
    expect(w.get('[data-test="span-exception"]').text()).toContain('context.deadlineExceededError')
    expect(w.get('[data-test="span-exception"]').text()).toContain('context deadline exceeded')
    expect(w.get('[data-test="span-source"]').text()).toBe('OTel')
    expect(w.get('[data-test="span-tab-attributes"]').text()).toMatch(/^Attributes\s*1$/)
    expect(w.get('[data-test="span-tab-events"]').text()).toMatch(/^Events\s*1$/)
    expect(w.get('[data-test="span-tab-resource"]').text()).toMatch(/^Resource\s*5$/)
    expect(w.get('[data-test="span-details"]').text()).toContain('+1 more in Resource')
    expect(w.get('[data-test="span-details"]').text()).toContain('trace-1')
  })

  it('arrow keys move between the tabs; Resource lists every key', async () => {
    const w = render([otelSpan])
    await w.get('[data-test="wf-label"]').trigger('click')
    await opened(w)
    await w.get('[data-test="span-tab-overview"]').trigger('keydown', { key: 'End' })

    expect(w.get('[data-test="span-tab-resource"]').attributes('aria-selected')).toBe('true')
    expect(w.get('[role="tabpanel"]').text()).toContain('service.version')
    expect(w.get('[role="tabpanel"]').text()).toContain('1.8.2')
  })

  it('a Sentry SDK span: no Events / Links / Resource tabs, no exception block', async () => {
    const w = render([span({ source: 'sentry', attributes: { 'db.system': 'mysql' } })])
    await w.get('[data-test="wf-label"]').trigger('click')
    await opened(w)

    expect(w.find('[data-test="span-tab-events"]').exists()).toBe(false)
    expect(w.find('[data-test="span-exception"]').exists()).toBe(false)
    expect(w.get('[data-test="span-tab-attributes"]').text()).toMatch(/^Attributes\s*1$/)
  })

  it('Esc closes the details and focus returns to the row', async () => {
    const w = render([otelSpan])
    const label = w.get('[data-test="wf-label"]')
    await label.trigger('click')
    await opened(w)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await w.vm.$nextTick()
    await w.vm.$nextTick()

    expect(w.find('[data-test="span-details"]').exists()).toBe(false)
    expect(document.activeElement).toBe(label.element)
  })

  it('a long stack shows 8 lines until «Show full stack»', async () => {
    const long = Array.from({ length: 30 }, (_, i) => `frame ${i}`).join('\n')
    const attrs = { ...otelSpan.attributes, 'otel.events': [{ name: 'exception', time: null, attributes: { 'exception.type': 'E', 'exception.stacktrace': long } }] }
    const w = render([{ ...otelSpan, attributes: attrs }])
    await w.get('[data-test="wf-label"]').trigger('click')
    await opened(w)

    expect(w.get('[data-test="span-stack"]').text().split('\n')).toHaveLength(8)
    await w.get('[data-test="span-exception"] button').trigger('click')
    expect(w.get('[data-test="span-stack"]').text()).toContain('frame 29')
  })

  it('reviewer #359: status with the span, a real minus for skewed clocks, a gap before the duration', async () => {
    const w = render([{ ...otelSpan, start_offset_ms: -13800 }])
    // Two items of a flex cell with a gap, not one run of text.
    expect(w.get('[data-test="wf-dur"]').findAll('span').map((x) => x.text())).toEqual(['error', '300ms'])
    await w.get('[data-test="wf-label"]').trigger('click')
    await opened(w)

    const details = w.get('[data-test="span-details"]').text()
    expect(details).toContain('\u221213800 ms')
    expect(details).not.toContain('+-')
    expect(details).toContain('status_code')
    await w.get('[data-test="span-tab-attributes"]').trigger('click')
    expect(w.get('[role="tabpanel"]').text()).not.toContain('otel.status_code')
  })
})

