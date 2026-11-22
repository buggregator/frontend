import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import SentryQueueJobPage from './sentry-queue-job-page.vue'

const route = reactive({ params: { id: 'm1' } as Record<string, string> })
vi.mock('vue-router', () => ({ useRoute: () => route }))
vi.mock('@/entities/sentry/lib/use-sentry-events-bus', () => ({ onSentryEvent: vi.fn() }))

const detail = {
  id: 'm1', message_id: 'm1', job: 'App\\Jobs\\SendInvoice', queue: 'emails', connection: 'redis', status: 'ok',
  failed: false, attempts: 1, failed_attempts: 0, retried: false, duration_ms: 120, latency_ms: 5,
  started_at: '2026-11-21T10:00:00.000Z', finished_at: '2026-11-21T10:00:00.120Z', trace_id: 'tr', transaction_id: 'tx',
  project: 'default', attempt_list: [], dispatched_by: null
}
const fetchMock = vi.fn()

const settle = async () => {
  await flushPromises()
  await vi.dynamicImportSettled()
  await flushPromises()
}

const render = async () => {
  const w = mount(SentryQueueJobPage, { global: { stubs: { RouterLink: RouterLinkStub } } })
  await settle()
  return w
}

describe('SentryQueueJobPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    route.params = { id: 'm1' }
  })

  afterEach(() => vi.unstubAllGlobals())

  it('loading first', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    const w = mount(SentryQueueJobPage, { global: { stubs: { RouterLink: RouterLinkStub } } })
    const loading = w.get('[data-test="queue-job-loading"]')
    expect(loading.attributes('role')).toBe('status')
    expect(loading.attributes('aria-label')).toBe('Loading the queue job')
  })

  it('the job', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(detail)))
    const w = await render()
    expect(fetchMock.mock.calls[0][0]).toContain('/api/sentry/queues/jobs/m1')
    expect(w.get('h2').text()).toBe('SendInvoice')
  })

  it('an unknown job: says so, with a way back', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 404 }))
    const w = await render()
    expect(w.get('[data-test="queue-not-found"]').text()).toContain('No such queue job')
    expect(w.getComponent(RouterLinkStub).props('to')).toEqual({ name: 'sentry-queues' })
  })

  it('error: what failed and a retry', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }))
    const w = await render()
    expect(w.get('[role="alert"]').text()).toContain('Could not load the queue job')

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(detail)))
    await w.get('.status-panel__action').trigger('click')
    await settle()
    expect(w.find('[role="alert"]').exists()).toBe(false)
    expect(w.get('h2').text()).toBe('SendInvoice')
  })
})
