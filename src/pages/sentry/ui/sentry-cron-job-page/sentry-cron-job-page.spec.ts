import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { useEventsStore } from '@/shared/stores'
import SentryCronJobPage from './sentry-cron-job-page.vue'

const route = reactive({ params: { slug: 'backup' } as Record<string, string>, query: {} as Record<string, string> })
vi.mock('vue-router', () => ({ useRoute: () => route }))
vi.mock('@/entities/sentry/lib/use-sentry-events-bus', () => ({ onSentryEvent: vi.fn() }))

const monitor = {
  project: 'blog', slug: 'backup', source: 'ping', schedule: null, timezone: 'UTC', checkin_margin: 1, max_runtime: 30,
  last_status: 'ok', last_checkin_at: null, next_expected_at: null, created_at: '2026-11-21T10:00:00.000Z',
  recent: [{ status: 'ok', started_at: '2026-11-21T10:00:00.000Z' }]
}
const fetchMock = vi.fn()

// The table and the job view are async components: wait for their import.
const settle = async () => {
  await flushPromises()
  await vi.dynamicImportSettled()
  await flushPromises()
}

const render = async () => {
  const w = mount(SentryCronJobPage, { global: { stubs: { RouterLink: RouterLinkStub } } })
  await settle()
  return w
}

describe('SentryCronJobPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useEventsStore().setActiveProjectKey('default')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    route.params = { slug: 'backup' }
    route.query = { project: 'blog' }
  })

  afterEach(() => vi.unstubAllGlobals())

  it('loading first', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    const w = mount(SentryCronJobPage, { global: { stubs: { RouterLink: RouterLinkStub } } })
    expect(w.get('[data-test="cron-job-loading"]').text()).toContain('Loading the cron job')
  })

  it('the job of the project in the link', async () => {
    fetchMock.mockImplementation((u: string) =>
      Promise.resolve(
        new Response(
          JSON.stringify(u.includes('/checkins') ? { data: [], meta: { total: 0, page: 1, limit: 50 } } : { data: [monitor] })
        )
      )
    )
    const w = await render()
    expect(fetchMock.mock.calls.every(([u]) => String(u).includes('project=blog'))).toBe(true)
    expect(w.get('h2').text()).toBe('backup')
  })

  it('an unknown job: «not found» with a way back', async () => {
    route.params = { slug: 'nope' }
    fetchMock.mockImplementation((u: string) =>
      Promise.resolve(u.includes('/checkins') ? new Response('', { status: 404 }) : new Response(JSON.stringify({ data: [] })))
    )
    const w = await render()
    const panel = w.get('[data-test="cron-not-found"]')
    expect(panel.text()).toContain('No such cron job')
    expect(panel.text()).toContain('«nope»')
    expect(panel.getComponent(RouterLinkStub).props('to')).toEqual({ name: 'sentry-crons' })
  })

  it('a failed load: the reason and a retry', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 500 }))
    const w = await render()
    expect(w.get('[role="alert"]').text()).toContain('Could not load the cron job')
  })
})
