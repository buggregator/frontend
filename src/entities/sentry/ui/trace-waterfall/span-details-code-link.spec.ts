import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { CODE_LOCATION_LINK } from '@/shared/lib/code-location-link'
import type { SentrySpan } from '../../types'
import SpanDetails from './span-details.vue'

// #6573 A: «Code» on a span whose attributes say where its code is.
const Probe = defineComponent({
  props: { file: { type: String, default: '' }, line: { type: Number, default: 0 }, origin: { type: String, default: '' }, label: { type: String, default: '' } },
  setup: (p) => () => h('a', { 'data-test': 'probe' }, `${p.label} ${p.file}:${p.line} ${p.origin}`)
})

const span = (attributes: Record<string, unknown>): SentrySpan => ({
  span_id: 's1',
  parent_span_id: null,
  op: 'function',
  description: 'CheckoutService::placeOrder',
  status: 'ok',
  start_offset_ms: 0,
  duration_ms: 12,
  peer_type: null,
  peer_address: null,
  is_error: false,
  attributes
})

const render = (s: SentrySpan) =>
  mount(SpanDetails, { props: { span: s }, global: { provide: { [CODE_LOCATION_LINK as symbol]: Probe } } })

describe('SpanDetails: code graph link', () => {
  it('passes the span code location and its name', () => {
    const w = render(span({ 'code.filepath': '/var/www/html/app/A.php', 'code.lineno': 88 }))
    expect(w.get('[data-test="probe"]').text()).toBe('Code /var/www/html/app/A.php:88 CheckoutService::placeOrder')
  })

  it('no link when the span has no code location', () => {
    expect(render(span({ 'http.method': 'GET' })).find('[data-test="probe"]').exists()).toBe(false)
  })
})
