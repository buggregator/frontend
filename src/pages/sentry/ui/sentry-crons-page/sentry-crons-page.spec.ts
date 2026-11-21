import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventsStore } from '@/shared/stores'
import SentryCronsPage from './sentry-crons-page.vue'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/entities/sentry/lib/use-sentry-events-bus', () => ({ onSentryEvent: vi.fn() }))
vi.mock('@/widgets/ui', () => ({
  SetupHelpPanel: { props: ['sectionId'], template: '<div class="setup-stub" :data-section="sectionId" />' }
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

  it('loading: skeleton rows with words', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    const w = mount(SentryCronsPage, { global: { stubs: { RouterLink: RouterLinkStub } } })
    expect(w.get('[data-test="crons-loading"]').text()).toContain('Loading cron jobs…')
  })

  it('empty: a short hint and the setup help', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [] })))
    const w = await render()
    expect(w.get('[data-test="crons-empty"]').text()).toContain('No cron jobs yet')
    expect(w.text()).toContain('/ping/my-job')

    await w.get('[data-test="crons-setup"]').trigger('click')
    expect(w.get('.setup-stub').attributes('data-section')).toBe('crons')
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
    await w.get('input[type="search"]').setValue('site')
    expect(w.findAll('[data-test="cron-row"]').map((r) => r.get('a').text())).toEqual(['sitemap'])
  })
})
