import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventsStore } from '@/shared/stores'
import SentryCronsPage from './sentry-crons-page.vue'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/entities/sentry/lib/use-sentry-events-bus', () => ({ onSentryEvent: vi.fn() }))
vi.mock('@/widgets/ui', () => ({
  SetupGuide: {
    props: ['sectionId', 'sectionTitle', 'kicker'],
    template: '<div class="setup-stub" :data-section="sectionId" :data-kicker="kicker" />'
  }
}))

const now = Date.now()
const monitor = (slug: string, last_status = 'ok') => ({
  project: 'default', slug, source: 'sentry', schedule: { type: 'crontab', value: '0 3 * * *' }, timezone: 'UTC',
  checkin_margin: 1, max_runtime: 30, last_status, last_checkin_at: null,
  next_expected_at: new Date(now + 3_600_000).toISOString(), created_at: new Date(now).toISOString(),
  recent: [{ status: last_status, started_at: new Date(now - 60_000).toISOString() }]
})

const fetchMock = vi.fn()

// The table and the job view are async components: wait for their import.
const settle = async () => {
  await flushPromises()
  await vi.dynamicImportSettled()
  await flushPromises()
}

const render = async () => {
  const w = mount(SentryCronsPage, { global: { stubs: { RouterLink: RouterLinkStub } } })
  await settle()
  return w
}

describe('SentryCronsPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useEventsStore().setActiveProjectKey('default')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('loading: the shared skeleton, announced', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    const w = mount(SentryCronsPage, { global: { stubs: { RouterLink: RouterLinkStub } } })
    const loading = w.get('[data-test="crons-loading"]')
    expect(loading.attributes('role')).toBe('status')
    expect(loading.attributes('aria-label')).toBe('Loading cron jobs')
    expect(loading.findAll('.skeleton').length).toBeGreaterThan(0)
  })

  it('empty: the shared setup guide of the Crons section', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [] })))
    const w = await render()
    const guide = w.get('[data-test="crons-empty"]')
    expect(guide.attributes('data-section')).toBe('crons')
    expect(guide.attributes('data-kicker')).toBe('Sentry · Crons')
  })

  it('error: what failed and a retry', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }))
    const w = await render()
    expect(w.get('[role="alert"]').text()).toContain('Could not load cron jobs')

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data: [monitor('backup')] })))
    await w.get('.status-panel__action').trigger('click')
    await settle()
    expect(w.find('[role="alert"]').exists()).toBe(false)
    expect(w.text()).toContain('backup')
  })

  it('an older server: says so instead of an error', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 404 }))
    const w = await render()
    expect(w.find('[data-test="crons-unsupported"]').exists()).toBe(true)
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })

  it('the list: the count line, the table, the «Needs attention» filter', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: [monitor('backup'), monitor('orders-sync', 'error'), monitor('sitemap', 'in_progress')] }))
    )
    const w = await render()
    expect(w.get('[data-test="crons-summary"]').text().replace(/\s+/g, ' ')).toBe(
      '3 jobs · 1 needs attention · 1 running · 1 OK'
    )
    expect(w.findAll('[data-test="cron-row"]')).toHaveLength(3)

    await w.get('[data-test="crons-only-attention"]').trigger('click')
    expect(w.findAll('[data-test="cron-row"]').map((r) => r.get('a').text())).toEqual(['orders-sync'])

    await w.get('button[aria-pressed="false"]').trigger('click')
    await w.get('.search-bar__input').setValue('site')
    expect(w.findAll('[data-test="cron-row"]').map((r) => r.get('a').text())).toEqual(['sitemap'])
  })

  it('no match: says so, and «Clear filter» brings every job back', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [monitor('backup'), monitor('sitemap')] })))
    const w = await render()
    await w.get('[data-test="crons-only-attention"]').trigger('click')
    await w.get('.search-bar__input').setValue('nothing')
    expect(w.findAll('[data-test="cron-row"]')).toHaveLength(0)
    expect(w.get('[data-test="crons-no-match"]').text()).toContain('No job matches')

    await w.get('[data-test="crons-no-match"] .status-panel__action').trigger('click')
    expect(w.findAll('[data-test="cron-row"]')).toHaveLength(2)
    expect((w.get('.search-bar__input').element as HTMLInputElement).value).toBe('')
  })
})
