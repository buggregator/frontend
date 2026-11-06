import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventsStore } from '@/shared/stores'
import { useSentryRequests } from './use-sentry-requests'

const page = { data: [], meta: { total: 0, page: 1, limit: 50 } }

// Server facts (buggregator/server #352): every Sentry list takes the period
// (`window`), but only exceptions are stored with a project — traces, logs and
// metrics have no project column, so `project` is not sent there.
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

  it.each(['getTraces', 'getLogs', 'getMetrics'] as const)('%s takes the period but not the project', async (fn) => {
    await useSentryRequests()[fn]({ page: '1' })
    expect(query()).toMatchObject({ window: '7d', page: '1' })
    expect(query()).not.toHaveProperty('project')
  })

  // The tab badges label the lists: the server counts exceptions per project
  // and every type per period, so /counts takes both.
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
