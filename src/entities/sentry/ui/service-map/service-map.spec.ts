import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useEventsStore } from '@/shared/stores'
import { RouteName } from '@/shared/types'
import type { SentryServiceMap } from '../../types'
import ServiceMap from './service-map.vue'

const getServiceMap = vi.fn()
const getServiceMapEdge = vi.fn()

vi.mock('../../lib/use-sentry-requests', () => ({
  useSentryRequests: () => ({ getServiceMap, getServiceMapEdge })
}))

const edge = (source: string, target: string, count: number, errors: number, p95: number, traces = 0) => ({
  source,
  target,
  op_type: 'http',
  request_count: count,
  error_count: errors,
  error_rate: errors / count,
  avg_duration_ms: p95,
  p95_duration_ms: p95,
  trace_count: traces || count,
  traces: Array.from({ length: Math.min(20, traces || count) }, (_, i) => ({
    trace_id: `t${source}${i}`.padEnd(32, '0'),
    start_ts: '2026-11-20T18:05:00Z',
    duration_ms: 300,
    is_error: i === 0 && errors > 0
  }))
})
const node = (id: string, count: number, errors = 0, kind = 'service') => ({
  id,
  label: id,
  kind,
  request_count: count,
  error_count: errors,
  error_rate: count ? errors / count : 0,
  rpm: count / 15,
  avg_duration_ms: 100,
  p95_duration_ms: 300
})

const stand: SentryServiceMap = {
  from: '2026-11-20T18:00:00Z',
  to: '2026-11-20T18:15:00Z',
  window_minutes: 15,
  nodes: [node('shop-web', 30, 10), node('checkout-api', 60, 10), node('payments-worker', 90), node('payments.example', 30, 0, 'external')],
  edges: [
    edge('shop-web', 'checkout-api', 30, 10, 338),
    edge('checkout-api', 'payments-worker', 30, 10, 303, 45),
    edge('payments-worker', 'payments.example', 30, 0, 900)
  ]
}

const render = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/sentry/traces', name: RouteName.SentryTraces, component: { render: () => null } },
      { path: '/sentry/traces/:traceId', name: RouteName.SentryTraceDetail, component: { render: () => null } }
    ]
  })
  await router.push('/sentry/traces')
  await router.isReady()
  const w = mount(ServiceMap, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
  return w
}

describe('ServiceMap (#6533 B, V1 from #6540)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    window.localStorage.clear()
    getServiceMap.mockReset().mockResolvedValue(stand)
    getServiceMapEdge.mockReset()
    // jsdom has no canvas: the particles draw nothing, the rest renders.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('draws every service with its numbers and every line with count, share, errors and p95', async () => {
    const w = await render()
    expect(w.findAll('.svc-map__node')).toHaveLength(4)
    const shop = w.get('[data-test="svc-node-shop-web"]').text()
    expect(shop).toContain('in 30')
    expect(shop).toContain('out 30')
    expect(shop).toContain('33% errors')
    expect(w.get('[data-test="svc-node-payments.example"]').text()).toContain('external')

    const line = w.get('[data-test="svc-edge-checkout-api-payments-worker"]')
    expect(line.text()).toContain('30 · 100%')
    expect(line.text()).toContain('✕ 33% err')
    expect(line.text()).toContain('p95 303 ms')
    expect(line.classes()).toContain('svc-map__label--err')
    expect(w.find('.svc-map__entry').text()).toContain('30 in')
  })

  it('names the hot spots on the lines and in the table', async () => {
    const w = await render()
    const rows = w.findAll('[data-test="svc-hot-spots"] .svc-map__hot-row').map((r) => r.text())
    expect(rows[0]).toContain('busiest')
    expect(rows[0]).toContain('shop-web → checkout-api')
    expect(rows.find((r) => r.includes('most errors'))).toContain('10 of 30 calls failed')
    expect(rows.find((r) => r.includes('slowest'))).toContain('payments-worker → payments.example')
  })

  it('a service click opens its panel with Uses / Used and a Traces link; the rest dims; Esc clears', async () => {
    const w = await render()
    await w.get('[data-test="svc-node-checkout-api"]').trigger('click')
    const drawer = w.get('[data-test="svc-drawer"]')
    expect(drawer.text()).toContain('Calls 1 service')
    expect(drawer.text()).toContain('Called by 1 service')
    expect(w.get('[data-test="svc-drawer-traces"]').attributes('href')).toBe('/sentry/traces?view=list&service=checkout-api')
    expect(w.get('[data-test="svc-node-payments.example"]').classes()).toContain('is-dim')
    expect(w.get('[data-test="svc-node-shop-web"]').classes()).not.toContain('is-dim')

    await w.get('[data-test="service-map"]').trigger('keydown', { key: 'Escape' })
    expect(w.find('[data-test="svc-drawer"]').exists()).toBe(false)
  })

  it('#6549: closing the panel puts focus back on the service that opened it', async () => {
    const w = await render()
    const node = w.get('[data-test="svc-node-checkout-api"]')
    ;(node.element as HTMLElement).focus()
    await node.trigger('click')
    await w.get('[aria-label="Close the panel"]').trigger('click')
    await flushPromises()
    expect(document.activeElement).toBe(node.element)
  })

  it('a line click lists its traces, and loads the rest on demand', async () => {
    getServiceMapEdge.mockResolvedValue({ total: 45, traces: [{ trace_id: 'more'.padEnd(32, '0'), start_ts: '2026-11-20T18:06:00Z', duration_ms: 10, is_error: false }] })
    const w = await render()
    await w.get('[data-test="svc-edge-checkout-api-payments-worker"]').trigger('click')
    const drawer = w.get('[data-test="svc-drawer"]')
    expect(drawer.findAll('.svc-drawer__trace')).toHaveLength(20)
    expect(drawer.text()).toContain('25 left')
    await drawer.get('.svc-drawer__more').trigger('click')
    await flushPromises()
    expect(getServiceMapEdge).toHaveBeenCalledWith(expect.objectContaining({ source: 'checkout-api', target: 'payments-worker', offset: '20' }))
    expect(w.findAll('.svc-drawer__trace')).toHaveLength(21)
  })

  it('reviewer #361: an older map reply that lands last does not replace the newer one', async () => {
    const w = await render()
    const deferred = () => {
      let resolve!: (v: SentryServiceMap) => void
      return { promise: new Promise<SentryServiceMap>((r) => (resolve = r)), resolve: (v: SentryServiceMap) => resolve(v) }
    }
    const slow = deferred()
    const fast = deferred()
    getServiceMap.mockReturnValueOnce(slow.promise).mockReturnValueOnce(fast.promise)
    const store = useEventsStore()
    store.setPeriod('7d')
    await flushPromises()
    store.setPeriod('15m')
    await flushPromises()

    const only = { ...stand, nodes: [node('fresh-api', 5)], edges: [] }
    fast.resolve(only)
    await flushPromises()
    slow.resolve(stand)
    await flushPromises()
    expect(w.find('[data-test="svc-node-fresh-api"]').exists()).toBe(true)
    expect(w.find('[data-test="svc-node-shop-web"]').exists()).toBe(false)
  })

  it('reviewer #361: «Show more» for one line never lands in another, and survives a map refresh', async () => {
    let resolveMore!: (v: unknown) => void
    getServiceMapEdge.mockReturnValueOnce(new Promise((r) => (resolveMore = r)))
    const w = await render()
    await w.get('[data-test="svc-edge-checkout-api-payments-worker"]').trigger('click')
    await w.get('.svc-drawer__more').trigger('click')
    // Pick another line before the reply.
    await w.get('[data-test="svc-edge-shop-web-checkout-api"]').trigger('click')
    resolveMore({ total: 45, traces: [{ trace_id: 'late'.padEnd(32, '0'), start_ts: '2026-11-20T18:06:00Z', duration_ms: 10, is_error: false }] })
    await flushPromises()
    expect(w.findAll('.svc-drawer__trace')).toHaveLength(20)
    expect(w.text()).not.toContain('late00000000')

    // Back on the long line: one page more, a duplicate skipped, then a refresh keeps it.
    getServiceMapEdge.mockResolvedValueOnce({
      total: 46,
      traces: [
        { trace_id: 'tcheckout-api0'.padEnd(32, '0'), start_ts: '2026-11-20T18:05:00Z', duration_ms: 300, is_error: true },
        { trace_id: 'more'.padEnd(32, '0'), start_ts: '2026-11-20T18:06:00Z', duration_ms: 10, is_error: false }
      ]
    })
    await w.get('[data-test="svc-edge-checkout-api-payments-worker"]').trigger('click')
    await w.get('.svc-drawer__more').trigger('click')
    await flushPromises()
    expect(w.findAll('.svc-drawer__trace')).toHaveLength(21)
    expect(w.find('.svc-drawer__more').exists()).toBe(false)

    getServiceMap.mockResolvedValueOnce(structuredClone(stand))
    useEventsStore().setPeriod('1h')
    await flushPromises()
    expect(w.findAll('.svc-drawer__trace')).toHaveLength(21)
  })

  it('Pause traffic is a toggle remembered in this browser', async () => {
    const w = await render()
    const btn = w.get('[data-test="svc-map-pause"]')
    expect(btn.attributes('aria-pressed')).toBe('false')
    await btn.trigger('click')
    expect(btn.attributes('aria-pressed')).toBe('true')
    expect(btn.text()).toContain('Play traffic')
    expect(window.localStorage.getItem('sentry_service_map_paused')).toBe('1')
  })

  it('says so when the period has no calls, and offers a retry on an error', async () => {
    getServiceMap.mockResolvedValueOnce({ nodes: [], edges: [], window_minutes: 60 })
    const empty = await render()
    expect(empty.find('[data-test="svc-map-empty"]').exists()).toBe(true)
    empty.unmount()

    getServiceMap.mockRejectedValueOnce(new Error('Request failed: 500'))
    const failed = await render()
    expect(failed.text()).toContain('Could not load the service map')
  })
})
