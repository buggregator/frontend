import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { SentryLog } from '../../types'
import SentryLogRow from './sentry-log-row.vue'

const log = (over: Partial<SentryLog> = {}): SentryLog => ({
  id: '1',
  level: 'error',
  severity_number: 17,
  body: 'charge failed',
  trace_id: null,
  span_id: null,
  log_ts: '2026-11-20T10:00:00Z',
  attributes: { 'code.line.number': 91 },
  ...over
})

const render = (l: SentryLog) => mount(SentryLogRow, { props: { log: l }, global: { stubs: { RouterLink: true } } })

describe('SentryLogRow', () => {
  it('shows the service of the log in its own column', () => {
    expect(render(log({ service_name: 'checkout-api' })).get('[data-test="log-service"]').text()).toBe('checkout-api')
    expect(render(log({ service_name: null })).get('[data-test="log-service"]').text()).toBe('')
  })

  it('an OTel log: resource apart from attributes, with the source label and the trace ids', async () => {
    const wrapper = render(
      log({
        source: 'otel',
        service_name: 'checkout-api',
        trace_id: 'abc',
        span_id: 'def',
        attributes: {
          'code.line.number': 91,
          'otel.resource': { 'service.name': 'checkout-api', 'host.name': 'pod-1' },
          'otel.scope': { name: 'app' }
        }
      })
    )
    await wrapper.trigger('click')

    const details = wrapper.get('[data-test="log-details"]').text()
    expect(details).toContain('code.line.number')
    expect(details).not.toContain('otel.resource')
    const resource = wrapper.get('[data-test="log-resource"]').text()
    expect(resource).toContain('OTel')
    expect(resource).toContain('host.name')
    expect(details).toContain('abc')
  })

  it('a Sentry log: attributes only, no resource block', async () => {
    const wrapper = render(log({ source: 'sentry' }))
    await wrapper.trigger('click')

    expect(wrapper.get('[data-test="log-details"]').text()).toContain('code.line.number')
    expect(wrapper.find('[data-test="log-resource"]').exists()).toBe(false)
  })
})
