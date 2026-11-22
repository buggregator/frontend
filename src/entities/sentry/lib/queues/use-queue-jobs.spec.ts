import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { useEventsStore } from '@/shared/stores'
import { onSentryEvent } from '../use-sentry-events-bus'
import { useQueueJob, useQueueJobs, useQueueSummary } from './use-queue-jobs'

vi.mock('../use-sentry-events-bus', () => ({ onSentryEvent: vi.fn() }))

const job = (id: string) => ({
  id, message_id: id, job: 'App\\Jobs\\SendInvoice', queue: 'default', connection: 'redis', status: 'ok',
  failed: false, attempts: 1, failed_attempts: 0, retried: false, duration_ms: 120, latency_ms: 5,
  started_at: '2026-11-21T10:00:00.000Z', finished_at: '2026-11-21T10:00:00.120Z', trace_id: 'tr', transaction_id: 'tx',
  project: 'shop'
})
const summary = { jobs: 3, failed: 1, retried: 1, attempts: 5, avg_duration_ms: 120.5, queues: [{ queue: 'default', jobs: 3, failed: 1 }] }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const page = (data: unknown[], total = data.length) => json({ data, meta: { total, page: 1, limit: 50 } })

const run = <T>(fn: () => T) => {
  let result!: T
  mount(defineComponent({ setup: () => { result = fn(); return () => h('div') } }))
  return result
}

const urls = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.map(([u]) => new URL(u as string, 'http://x'))
const params = (url: URL) => Object.fromEntries(url.searchParams)

const fetchMock = vi.fn()

beforeEach(() => {
  setActivePinia(createPinia())
  useEventsStore().setActiveProjectKey('shop')
  useEventsStore().setPeriod('1h')
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  vi.mocked(onSentryEvent).mockClear()
})

afterEach(() => vi.unstubAllGlobals())

describe('useQueueSummary', () => {
  it('loads the summary of the project and period', async () => {
    fetchMock.mockResolvedValueOnce(json(summary))
    const { summary: s, hasLoaded } = run(() => useQueueSummary())
    await flushPromises()

    const [url] = urls(fetchMock)
    expect(url.pathname).toBe('/api/sentry/queues/summary')
    expect(params(url)).toEqual({ project: 'shop', window: '1h' })
    expect(s.value?.jobs).toBe(3)
    expect(hasLoaded.value).toBe(true)
  })

  it('an older server (404): unsupported, not an error', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 404 }))
    const { unsupported, error, summary: s } = run(() => useQueueSummary())
    await flushPromises()
    expect(unsupported.value).toBe(true)
    expect(error.value).toBe('')
    expect(s.value).toBeNull()
  })

  it('a failed refresh keeps the numbers; refreshes on a trace and on a period change', async () => {
    fetchMock.mockResolvedValueOnce(json(summary))
    const { summary: s, error } = run(() => useQueueSummary())
    await flushPromises()

    const [cb, kinds] = vi.mocked(onSentryEvent).mock.calls[0]
    expect(kinds).toEqual(['trace'])
    fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }))
    cb()
    await flushPromises()
    expect(s.value?.jobs).toBe(3)
    expect(error.value).toBe('The server answered 500.')

    fetchMock.mockResolvedValueOnce(json(summary))
    useEventsStore().setPeriod('24h')
    await flushPromises()
    expect(urls(fetchMock)[2].searchParams.get('window')).toBe('24h')
  })
})

describe('useQueueJobs', () => {
  it('asks for the first page with the filters', async () => {
    fetchMock.mockResolvedValueOnce(page([job('a')], 1))
    const queue = ref('emails')
    const failedOnly = ref(true)
    const { jobs, isInitialLoading, hasMore } = run(() => useQueueJobs({ queue, failedOnly }))
    expect(isInitialLoading.value).toBe(true)
    await flushPromises()

    const [url] = urls(fetchMock)
    expect(url.pathname).toBe('/api/sentry/queues/jobs')
    expect(params(url)).toEqual({ project: 'shop', window: '1h', page: '1', limit: '50', queue: 'emails', status: 'failed' })
    expect(jobs.value.map((j) => j.id)).toEqual(['a'])
    expect(hasMore.value).toBe(false)
    expect(isInitialLoading.value).toBe(false)
  })

  it('«Show more» adds the next page; a filter change starts over', async () => {
    const first = Array.from({ length: 50 }, (_, i) => job(`j${i}`))
    fetchMock.mockResolvedValueOnce(page(first, 60))
    const queue = ref('')
    const { jobs, hasMore, loadMore } = run(() => useQueueJobs({ queue, failedOnly: false }))
    await flushPromises()
    expect(hasMore.value).toBe(true)

    fetchMock.mockResolvedValueOnce(page([job('j49'), job('x')], 60))
    loadMore()
    await flushPromises()
    expect(params(urls(fetchMock)[1])).toMatchObject({ page: '2', limit: '50' })
    // A row seen on both pages is kept once.
    expect(jobs.value).toHaveLength(51)

    fetchMock.mockResolvedValueOnce(page([job('q')], 1))
    queue.value = 'emails'
    await flushPromises()
    expect(params(urls(fetchMock)[2])).toMatchObject({ page: '1', limit: '50', queue: 'emails' })
    expect(jobs.value.map((j) => j.id)).toEqual(['q'])
  })

  it('a live refresh (a trace came) asks for all the rows shown', async () => {
    const first = Array.from({ length: 50 }, (_, i) => job(`j${i}`))
    fetchMock.mockResolvedValueOnce(page(first, 80))
    const { loadMore } = run(() => useQueueJobs({ queue: '', failedOnly: false }))
    await flushPromises()
    fetchMock.mockResolvedValueOnce(page([job('k')], 80))
    loadMore()
    await flushPromises()

    const [cb, kinds] = vi.mocked(onSentryEvent).mock.calls[0]
    expect(kinds).toEqual(['trace'])
    fetchMock.mockResolvedValueOnce(page(first, 80))
    cb()
    await flushPromises()
    expect(params(urls(fetchMock)[2])).toMatchObject({ page: '1', limit: '51' })
  })

  it('reports a failure', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }))
    const { error } = run(() => useQueueJobs({ queue: '', failedOnly: false }))
    await flushPromises()
    expect(error.value).toBe('The server answered 500.')
  })
})

describe('useQueueJob', () => {
  it('loads one job by its id, with no project or period', async () => {
    fetchMock.mockResolvedValueOnce(json({ ...job('m/1'), attempt_list: [], dispatched_by: null }))
    const { job: j, hasLoaded, notFound } = run(() => useQueueJob('m/1'))
    await flushPromises()

    const [url] = urls(fetchMock)
    expect(url.pathname).toBe('/api/sentry/queues/jobs/m%2F1')
    expect(url.search).toBe('')
    expect(j.value?.id).toBe('m/1')
    expect(hasLoaded.value).toBe(true)
    expect(notFound.value).toBe(false)
  })

  it('404: not found; other failures are errors', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 404 }))
    const a = run(() => useQueueJob('nope'))
    await flushPromises()
    expect(a.notFound.value).toBe(true)
    expect(a.error.value).toBe('')

    fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }))
    const b = run(() => useQueueJob('x'))
    await flushPromises()
    expect(b.notFound.value).toBe(false)
    expect(b.error.value).toBe('The server answered 500.')
  })

  it('reloads on a new trace or error, and on another id', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(json({ ...job('a'), attempt_list: [], dispatched_by: null })))
    const id = ref('a')
    run(() => useQueueJob(id))
    await flushPromises()

    const [cb, kinds] = vi.mocked(onSentryEvent).mock.calls[0]
    expect(kinds).toEqual(['trace', 'error'])
    cb()
    await flushPromises()
    id.value = 'b'
    await flushPromises()
    expect(urls(fetchMock).map((u) => u.pathname)).toEqual([
      '/api/sentry/queues/jobs/a',
      '/api/sentry/queues/jobs/a',
      '/api/sentry/queues/jobs/b'
    ])
  })
})
