import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import EventPage from './event-page.vue'

const getItem = vi.fn()

vi.mock('@/shared/lib/use-events', () => ({
  useEvents: () => ({ events: { getItem } }),
}))

const stub = { template: '<div><slot /><slot name="header" /></div>' }

describe('EventPage: tab title', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
    getItem.mockReset()
  })

  // Audit 5.16: /sentry/event/:id has no :type, so the title was read before the
  // event loaded and stayed « > <id> | Buggregator».
  it('names the event type once the event has loaded', async () => {
    getItem.mockResolvedValue({ uuid: 'abc', type: 'sentry', payload: {} })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/sentry/event/:id', component: EventPage }],
    })
    await router.push('/sentry/event/abc')
    await router.isReady()

    mount(EventPage, {
      global: {
        plugins: [router],
        stubs: { LayoutBase: stub, LayoutSidebar: stub, PageEventHeader: stub, EventPageMapper: stub },
      },
    })
    await flushPromises()

    expect(document.title).toBe('Sentry > abc | Buggregator')
  })
})
