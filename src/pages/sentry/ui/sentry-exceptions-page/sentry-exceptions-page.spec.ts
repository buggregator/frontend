import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { LayoutPreviewEvents } from '@/widgets/ui'
import SentryExceptionsPage from './sentry-exceptions-page.vue'

vi.mock('@/entities/sentry/lib', () => ({
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
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // Audit 5.16: the timeline feed wrote «Events: N» over the page title.
  it('names its timeline feed «Sentry Exceptions»', () => {
    const wrapper = mount(SentryExceptionsPage, {
      global: { stubs: { LayoutPreviewEvents: true, SentrySubNav: true } },
    })
    expect(wrapper.findComponent(LayoutPreviewEvents).props('title')).toBe('Sentry Exceptions')
  })

  // Audit 5.15: the level select had no label.
  it('labels the level select', () => {
    const wrapper = mount(SentryExceptionsPage, {
      global: { stubs: { LayoutPreviewEvents: true, SentrySubNav: true } },
    })
    expect(wrapper.get('select').attributes('aria-label')).toBe('Level')
  })
})
