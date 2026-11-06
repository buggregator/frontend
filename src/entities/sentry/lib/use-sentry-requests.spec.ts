import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventsStore } from '@/shared/stores'
import { useSentryRequests } from './use-sentry-requests'

const page = { data: [], meta: { total: 0, page: 1, limit: 50 } }

// Server facts: every Sentry list takes the period (`window`) and, since
// buggregator/server #365/#366, the project too — traces, logs, metrics, the
// service map and the tab counts are stored per project.
describe('useSentryRequests: scope', () => {
  const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify(page))))

  beforeEach(() => {
    setActivePinia(createPinia())
    const store = useEventsStore()
    store.setActiveProjectKey('shop')
    store.setPeriod('7d')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const query = () => {
    const [url] = fetchMock.mock.calls[0] as unknown as [string]
    return Object.fromEntries(new URL(url, 'http://x').searchParams)
  }

  it('scopes exceptions by project and period', async () => {
    await useSentryRequests().getExceptionsGrouped({ page: '1' })
    expect(query()).toMatchObject({ project: 'shop', window: '7d', grouped: 'true' })
  })

  it.each(['getTraces', 'getLogs', 'getMetrics'] as const)('%s takes the project and the period', async (fn) => {
    await useSentryRequests()[fn]({ page: '1' })
    expect(query()).toMatchObject({ project: 'shop', window: '7d', page: '1' })
  })

  it('scopes the service map by project and keeps its window', async () => {
    await useSentryRequests().getServiceMap(15)
    expect(query()).toEqual({ project: 'shop', window: '15' })
  })

  // A trace can span several projects, and with ?project the server answers 404
  // when the trace has no transaction in that project (e.g. an error's trace
  // started elsewhere). The trace detail always shows the whole trace.
  it('loads a trace detail without the project', async () => {
    await useSentryRequests().getTraceDetail('abc')
    expect(query()).not.toHaveProperty('project')
  })

  // The tab badges label the lists, so /counts takes the same scope.
  it('counts by project and period', async () => {
    await useSentryRequests().getCounts()
    expect(query()).toMatchObject({ project: 'shop', window: '7d' })
  })

  it('keeps an explicit time range over the period', async () => {
    await useSentryRequests().getMetrics({ from: '2026-11-01' })
    expect(query()).not.toHaveProperty('window')
  })
})

describe('events store: period', () => {
  it('defaults to all time', () => {
    window.localStorage.clear()
    setActivePinia(createPinia())
    expect(useEventsStore().period).toBe('all')
  })
})
