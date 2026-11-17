import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventsStore } from '@/shared/stores'
import SentrySubNav from './sentry-sub-nav.vue'

const counts = { exceptions: 3, traces: 0, logs: 0, metrics: 0 }

// The counts must follow the same project and period as the lists under them.
describe('SentrySubNav: counts', () => {
  const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify(counts))))

  beforeEach(() => {
    setActivePinia(createPinia())
    useEventsStore().setActiveProjectKey('default')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const countsCalls = () =>
    (fetchMock.mock.calls as unknown as [string][]).filter(([url]) => url.includes('/api/sentry/counts'))

  const mountNav = async () => {
    mount(SentrySubNav, { global: { stubs: { RouterLink: RouterLinkStub } } })
    await flushPromises()
  }

  it('refetches counts when the period changes', async () => {
    await mountNav()
    expect(countsCalls()).toHaveLength(1)

    useEventsStore().setPeriod('1h')
    await flushPromises()

    expect(countsCalls()).toHaveLength(2)
    expect(countsCalls()[1][0]).toContain('window=1h')
  })

  it('refetches counts when the project changes', async () => {
    await mountNav()

    useEventsStore().setActiveProjectKey('shop')
    await flushPromises()

    expect(countsCalls()).toHaveLength(2)
    expect(countsCalls()[1][0]).toContain('project=shop')
  })
})

describe('SentrySubNav: tabs', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(new Response(JSON.stringify({ exceptions: 21, traces: 0, logs: 66, metrics: 0 })))
      )
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('marks the current tab, shows counts, hides tabs without data', async () => {
    const wrapper = mount(SentrySubNav, {
      props: { current: 'logs' },
      global: { stubs: { RouterLink: RouterLinkStub } }
    })
    await flushPromises()

    expect(wrapper.get('nav').attributes('aria-label')).toBe('Sentry')
    expect(wrapper.findAll('a').map((a) => a.text())).toEqual(['Exceptions 21', 'Logs 66'])
    expect(wrapper.get('[data-test="sentry-tab-logs"]').attributes('aria-current')).toBe('page')
    expect(wrapper.get('[data-test="sentry-tab-exceptions"]').attributes('aria-current')).toBeUndefined()
  })

  it('the open tab shows even with no data (a trace page under Traces)', async () => {
    const wrapper = mount(SentrySubNav, {
      props: { current: 'traces' },
      global: { stubs: { RouterLink: RouterLinkStub } }
    })
    await flushPromises()

    expect(wrapper.find('[data-test="sentry-tab-traces"]').exists()).toBe(true)
  })
})
