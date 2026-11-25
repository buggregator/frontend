import { flushPromises, shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive, ref } from 'vue'
import { reloadSentryFilters } from '@/entities/sentry'
import { useEventsStore } from '@/shared/stores'
import { SentryLogsPage } from './sentry-logs-page'
import { SentryMetricsPage } from './sentry-metrics-page'
import { SentryTracesPage } from './sentry-traces-page'

const { fetchList } = vi.hoisted(() => {
  const fetchList = vi.fn()
  return { fetchList }
})
const makeList = () => ({
  logs: ref([]),
  metrics: ref([]),
  traces: ref([]),
  hasLoaded: ref(true),
  error: ref(''),
  isInitialLoading: ref(false),
  total: ref(0),
  page: ref(1),
  filters: reactive({}),
  fetchList,
})

vi.mock('@/entities/sentry', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useSentryLogs: () => makeList(),
  useSentryMetrics: () => makeList(),
  useSentryTraces: () => makeList(),
  onSentryEvent: vi.fn(),
}))
vi.mock('vue-router', () => ({
  useRoute: () => reactive({ query: {} }),
  useRouter: () => ({ push: vi.fn() }),
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

// The lists are stored per project on the server; a project switch must
// re-send the request, as a period change does (frontend#383).
describe.each([
  ['Logs', SentryLogsPage],
  ['Metrics', SentryMetricsPage],
  ['Traces', SentryTracesPage],
])('Sentry %s page', (_, Page) => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    setActivePinia(createPinia())
    reloadSentryFilters()
    fetchList.mockReset()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('refetches the list when the project changes', async () => {
    const store = useEventsStore()
    store.setActiveProjectKey('default')
    shallowMount(Page)
    await flushPromises()
    const before = fetchList.mock.calls.length

    store.setActiveProjectKey('billing')
    await flushPromises()

    expect(fetchList.mock.calls.length).toBe(before + 1)
  })
})
