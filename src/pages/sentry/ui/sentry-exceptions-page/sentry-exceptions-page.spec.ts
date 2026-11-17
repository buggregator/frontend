import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { LayoutPreviewEvents } from '@/widgets/ui'
import { reloadSentryFilters, useSentryFilters } from '@/entities/sentry'
import SentryExceptionsPage from './sentry-exceptions-page.vue'

vi.mock('@/entities/sentry/lib', async () => ({
  ...(await vi.importActual<object>('@/entities/sentry/lib/use-sentry-filters')),
  useSentryExceptions: () => ({
    grouped: ref(false),
    groupedItems: ref([]),
    hasLoaded: ref(true),
    error: ref(''),
    isInitialLoading: ref(false),
    total: ref(0),
    page: ref(1),
    filters: { level: null },
    fetchList: vi.fn(),
  }),
  onSentryEvent: vi.fn(),
}))

const memoryStorage = () => {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, String(value)),
    removeItem: (key: string) => void items.delete(key),
    clear: () => items.clear(),
  }
}

describe('SentryExceptionsPage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    setActivePinia(createPinia())
    reloadSentryFilters()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // Audit 5.16: the timeline feed wrote «Events: N» over the page title.
  it('names its timeline feed «Sentry Exceptions»', () => {
    const wrapper = mount(SentryExceptionsPage, {
      global: { stubs: { LayoutPreviewEvents: true } },
    })
    expect(wrapper.findComponent(LayoutPreviewEvents).props('title')).toBe('Sentry Exceptions')
  })

  // #5980: the level is set in the header; the timeline matches it in the browser.
  it('passes the header’s level to the timeline feed', async () => {
    const wrapper = mount(SentryExceptionsPage, {
      global: { stubs: { LayoutPreviewEvents: true } },
    })
    const feed = () => wrapper.findComponent(LayoutPreviewEvents)
    expect(feed().props('filter')).toBeUndefined()

    useSentryFilters().exceptionsLevel = 'error'
    await wrapper.vm.$nextTick()
    const filter = feed().props('filter') as (e: { payload: unknown }) => boolean

    expect(filter({ payload: { level: 'error' } })).toBe(true)
    expect(filter({ payload: { level: 'warning' } })).toBe(false)
  })
})
