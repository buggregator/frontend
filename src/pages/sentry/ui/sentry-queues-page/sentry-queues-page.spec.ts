import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventsStore } from '@/shared/stores'
import SentryQueuesPage from './sentry-queues-page.vue'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn(), resolve: vi.fn() }) }))
vi.mock('@/entities/sentry/lib/use-sentry-events-bus', () => ({ onSentryEvent: vi.fn() }))
vi.mock('@/widgets/ui', () => ({
  SetupGuide: {
    props: ['sectionId', 'sectionTitle', 'kicker'],
    template: '<div class="setup-stub" :data-section="sectionId" :data-kicker="kicker" />'
  }
}))

const job = (id: string, over: Record<string, unknown> = {}) => ({
  id, message_id: id, job: 'App\\Jobs\\SendInvoice', queue: 'emails', connection: 'redis', status: 'ok',
  failed: false, attempts: 1, failed_attempts: 0, retried: false, duration_ms: 120, latency_ms: 5,
  started_at: new Date().toISOString(), finished_at: new Date().toISOString(), trace_id: 'tr', transaction_id: 'tx',
  project: 'default', ...over
})
const summary = (jobs: number) => ({
  jobs, failed: 1, retried: 1, attempts: jobs + 2, avg_duration_ms: 1500,
  queues: jobs ? [{ queue: 'emails', jobs: jobs - 1, failed: 1 }, { queue: 'reports', jobs: 1, failed: 0 }] : []
})
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const list = (data: unknown[], total = data.length) => json({ data, meta: { total, page: 1, limit: 50 } })

const fetchMock = vi.fn()
// Answers by route: the summary and the list are asked at the same time.
const answer = (jobs: () => Response, sum: () => Response = () => json(summary(3))) =>
  fetchMock.mockImplementation((u: string) => Promise.resolve(u.includes('/summary') ? sum() : jobs()))
const calls = () => (fetchMock.mock.calls as unknown as [string][]).map(([u]) => new URL(u, 'http://x'))

const settle = async () => {
  await flushPromises()
  await vi.dynamicImportSettled()
  await flushPromises()
}

const render = async () => {
  const w = mount(SentryQueuesPage, { global: { stubs: { RouterLink: RouterLinkStub } } })
  await settle()
  return w
}

describe('SentryQueuesPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useEventsStore().setActiveProjectKey('default')
    useEventsStore().setPeriod('all')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('loading: the shared skeleton, announced', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    const w = mount(SentryQueuesPage, { global: { stubs: { RouterLink: RouterLinkStub } } })
    const loading = w.get('[data-test="queues-loading"]')
    expect(loading.attributes('role')).toBe('status')
    expect(loading.attributes('aria-label')).toBe('Loading queue jobs')
    expect(loading.findAll('.skeleton').length).toBeGreaterThan(0)
  })

  it('no job at all: the setup guide of the Queues section', async () => {
    answer(() => list([]), () => json(summary(0)))
    const guide = (await render()).get('[data-test="queues-empty"]')
    expect(guide.attributes('data-section')).toBe('queues')
    expect(guide.attributes('data-kicker')).toBe('Sentry · Queues')
  })

  it('no job in a shorter period: says so, and shows all time on request', async () => {
    useEventsStore().setPeriod('1h')
    answer(() => list([]), () => json(summary(0)))
    const w = await render()
    const empty = w.get('[data-test="queues-empty-period"]')
    expect(empty.text()).toContain('No queue jobs in the last hour')
    await empty.get('.status-panel__action').trigger('click')
    expect(useEventsStore().period).toBe('all')
  })

  it('error: what failed and a retry', async () => {
    answer(() => new Response('', { status: 500 }))
    const w = await render()
    expect(w.get('[role="alert"]').text()).toContain('Could not load queue jobs')

    answer(() => list([job('a')]))
    await w.get('.status-panel__action').trigger('click')
    await settle()
    expect(w.find('[role="alert"]').exists()).toBe(false)
    expect(w.findAll('[data-test="queue-row"]')).toHaveLength(1)
  })

  it('an older server: says so instead of an error', async () => {
    answer(() => new Response('', { status: 404 }), () => new Response('', { status: 404 }))
    const w = await render()
    expect(w.get('[data-test="queues-unsupported"]').text()).toContain('This server has no queue jobs')
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })

  it('jobs: the summary tiles and the table', async () => {
    answer(() => list([job('a'), job('b', { failed: true, status: 'internal_error' })]))
    const w = await render()
    const tiles = w.get('[data-test="queues-summary"]').text()
    expect(tiles).toContain('jobs, all time')
    expect(tiles).toContain('failed')
    expect(tiles).toContain('retried')
    expect(tiles).toContain('1.5 s')
    expect(w.findAll('[data-test="queue-row"]')).toHaveLength(2)
  })

  it('the queue filter and «Failed only» ask the server, the toolbar stays', async () => {
    answer(() => list([job('a')]))
    const w = await render()
    const buttons = w.get('[data-test="queues-filter"]').findAll('button')
    expect(buttons.map((b) => b.text())).toEqual(['All', 'emails 2', 'reports 1'])

    await buttons[2].trigger('click')
    await settle()
    expect(calls().at(-1)!.searchParams.get('queue')).toBe('reports')
    expect(w.get('[data-test="queues-filter"]').findAll('button')[2].attributes('aria-pressed')).toBe('true')

    answer(() => list([]))
    await w.get('[data-test="queues-failed-only"]').trigger('click')
    await settle()
    expect(calls().at(-1)!.searchParams.get('status')).toBe('failed')
    const none = w.get('[data-test="queues-no-match"]')
    expect(w.find('[data-test="queues-filter"]').exists()).toBe(true)

    answer(() => list([job('a')]))
    await none.get('.status-panel__action').trigger('click')
    await settle()
    const last = calls().at(-1)!.searchParams
    expect(last.get('queue')).toBeNull()
    expect(last.get('status')).toBeNull()
  })

  it('«Show more» when the server has more', async () => {
    answer(() => list(Array.from({ length: 50 }, (_, i) => job(`j${i}`)), 70))
    const w = await render()
    const more = w.get('[data-test="queues-more"]')
    expect(more.text()).toBe('Show more (20 left)')
    answer(() => list([job('b')], 70))
    await more.trigger('click')
    await settle()
    expect(calls().at(-1)!.searchParams.get('page')).toBe('2')
    expect(w.findAll('[data-test="queue-row"]')).toHaveLength(51)
  })
})
