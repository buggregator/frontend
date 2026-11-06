import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventsStore } from '@/shared/stores'
import SentrySubNav from './sentry-sub-nav.vue'

const counts = { exceptions: 3, traces: 0, logs: 0, metrics: 0 }

// The badges must follow the same project and period as the lists under them.
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
