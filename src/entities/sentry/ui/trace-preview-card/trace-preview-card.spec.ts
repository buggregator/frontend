import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { SentryTrace } from '../../types'
import TracePreviewCard from './trace-preview-card.vue'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

const trace = (over: Partial<SentryTrace> = {}): SentryTrace => ({
  trace_id: 't1',
  transaction_id: 'x',
  transaction_name: 'POST /cart/checkout',
  op: 'http.server',
  status: 'error',
  duration_ms: 412,
  span_count: 10,
  error_count: 2,
  received_at: '2026-11-20T10:00:00Z',
  preview_spans: [],
  ...over
})

describe('TracePreviewCard (#6523)', () => {
  it('a mixed trace: the services chain and both source labels as text', () => {
    const w = mount(TracePreviewCard, {
      props: { trace: trace({ sources: ['sentry', 'otel'], services: ['shop-web', 'checkout-api', 'payments-worker'] }) }
    })
    expect(w.get('[data-test="trace-services"]').text()).toBe('shop-web → checkout-api → payments-worker')
    expect(w.findAll('[data-test="trace-source"]').map((s) => s.text())).toEqual(['Sentry SDK', 'OTel'])
  })

  it('an older server (no sources, no services): nothing extra', () => {
    const w = mount(TracePreviewCard, { props: { trace: trace() } })
    expect(w.find('[data-test="trace-services"]').exists()).toBe(false)
    expect(w.find('[data-test="trace-source"]').exists()).toBe(false)
  })
})
