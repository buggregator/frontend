import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { useEventsStore } from '@/shared/stores'
import { onSentryEvent } from '../use-sentry-events-bus'
import { useCronJob, useCronMonitors } from './use-cron-monitors'

vi.mock('../use-sentry-events-bus', () => ({ onSentryEvent: vi.fn() }))

const monitor = (slug: string, project = 'shop') => ({
  project, slug, source: 'ping', schedule: null, timezone: 'UTC', checkin_margin: 1, max_runtime: 30,
  last_status: 'ok', last_checkin_at: null, next_expected_at: null, created_at: '2026-11-21T10:00:00.000Z', recent: []
})
const checkIn = (id: string) => ({
  id, status: 'ok', started_at: '2026-11-21T10:00:00.000Z', finished_at: null, duration_ms: 10, environment: '',
  trace_id: '', source: 'ping', body: '', server_made: false, expected_at: null
})
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const page = (data: unknown[], total = data.length) => json({ data, meta: { total, page: 1, limit: 50 } })

const run = <T>(fn: () => T) => {
  let result!: T
  mount(defineComponent({ setup: () => { result = fn(); return () => h('div') } }))
  return result
}

const urls = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.map(([u]) => new URL(u as string, 'http://x'))

describe('useCronMonitors', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    setActivePinia(createPinia())
    useEventsStore().setActiveProjectKey('shop')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    vi.mocked(onSentryEvent).mockClear()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('loads the monitors of the selected project, not of a period', async () => {
    useEventsStore().setPeriod('1h')
    fetchMock.mockResolvedValueOnce(json({ data: [monitor('a')] }))
    const { monitors, isInitialLoading } = run(() => useCronMonitors())
    expect(isInitialLoading.value).toBe(true)
    await flushPromises()

    const [url] = urls(fetchMock)
    expect(url.pathname).toBe('/api/crons')
    expect(Object.fromEntries(url.searchParams)).toEqual({ project: 'shop' })
    expect(monitors.value.map((m) => m.slug)).toEqual(['a'])
    expect(isInitialLoading.value).toBe(false)
  })

  it('an older server (404) has no crons: unsupported, not an error', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 404 }))
    const { unsupported, error, monitors } = run(() => useCronMonitors())
    await flushPromises()

    expect(unsupported.value).toBe(true)
    expect(error.value).toBe('')
    expect(monitors.value).toEqual([])
  })

  it('reports other failures', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }))
    const { unsupported, error } = run(() => useCronMonitors())
    await flushPromises()

    expect(unsupported.value).toBe(false)
    expect(error.value).toBe('The server answered 500.')
  })

  it('a failed refresh keeps the list and reports the error', async () => {
    fetchMock.mockResolvedValueOnce(json({ data: [monitor('a')] }))
    const { monitors, error } = run(() => useCronMonitors())
    await flushPromises()

    fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }))
    vi.mocked(onSentryEvent).mock.calls[0][0]()
    await flushPromises()

    expect(monitors.value.map((m) => m.slug)).toEqual(['a'])
    expect(error.value).toBe('The server answered 500.')
  })

  it('refreshes on a cron check-in over the socket and on a project change', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(json({ data: [] })))
    run(() => useCronMonitors())
    await flushPromises()

    const [cb, kinds] = vi.mocked(onSentryEvent).mock.calls[0]
    expect(kinds).toEqual(['cron'])
    cb()
    await flushPromises()
    expect(fetchMock).toHaveBeenCalledTimes(2)

    useEventsStore().setActiveProjectKey('blog')
    await flushPromises()
    expect(urls(fetchMock)[2].searchParams.get('project')).toBe('blog')
  })
})

describe('useCronJob', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    setActivePinia(createPinia())
    useEventsStore().setActiveProjectKey('shop')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => vi.unstubAllGlobals())

  const route = (url: URL) => `${url.pathname}?${url.searchParams.toString()}`

  it('loads the monitor and its runs in its own project', async () => {
    fetchMock.mockImplementation((u: string) =>
      Promise.resolve(u.includes('/checkins') ? page([checkIn('1')], 1) : json({ data: [monitor('backup', 'blog')] }))
    )
    const { monitor: m, checkins, hasOlder, notFound } = run(() => useCronJob('backup', 'blog'))
    await flushPromises()

    expect(urls(fetchMock).map(route).sort()).toEqual([
      '/api/crons/backup/checkins?project=blog&page=1&limit=50',
      '/api/crons?project=blog'
    ])
    expect(m.value?.slug).toBe('backup')
    expect(checkins.value).toHaveLength(1)
    expect(hasOlder.value).toBe(false)
    expect(notFound.value).toBe(false)
  })

  it('an unknown job is «not found» (404 on its runs)', async () => {
    fetchMock.mockImplementation((u: string) =>
      Promise.resolve(u.includes('/checkins') ? new Response('', { status: 404 }) : json({ data: [] }))
    )
    const { notFound, error } = run(() => useCronJob('nope', 'shop'))
    await flushPromises()

    expect(notFound.value).toBe(true)
    expect(error.value).toBe('')
  })

  it('shows older check-ins page by page', async () => {
    const first = Array.from({ length: 50 }, (_, i) => checkIn(`a${i}`))
    fetchMock.mockImplementation((u: string) => {
      if (!u.includes('/checkins')) return Promise.resolve(json({ data: [monitor('backup')] }))
      return Promise.resolve(u.includes('page=2') ? page([checkIn('b1')], 51) : page(first, 51))
    })
    const job = run(() => useCronJob('backup', 'shop'))
    await flushPromises()
    expect(job.hasOlder.value).toBe(true)

    await job.loadOlder()
    expect(job.checkins.value).toHaveLength(51)
    expect(job.hasOlder.value).toBe(false)
  })

  it('an older page of the previous job is dropped after a switch', async () => {
    const first = Array.from({ length: 50 }, (_, i) => checkIn(`a${i}`))
    let answerOlder!: (r: Response) => void
    fetchMock.mockImplementation((u: string) => {
      if (!u.includes('/checkins')) return Promise.resolve(json({ data: [monitor('a'), monitor('b')] }))
      if (u.includes('/crons/a/') && u.includes('page=2')) return new Promise<Response>((r) => (answerOlder = r))
      return Promise.resolve(u.includes('/crons/a/') ? page(first, 51) : page([checkIn('b1')], 1))
    })
    const slug = ref('a')
    const job = run(() => useCronJob(slug, 'shop'))
    await flushPromises()

    const older = job.loadOlder()
    await flushPromises()
    slug.value = 'b'
    await flushPromises()
    answerOlder(page([checkIn('a-old')], 51))
    await older
    await flushPromises()

    expect(job.monitor.value?.slug).toBe('b')
    expect(job.checkins.value.map((c) => c.id)).toEqual(['b1'])
    expect(job.total.value).toBe(1)
    expect(job.loadingOlder.value).toBe(false)
  })

  it('a new slug starts afresh', async () => {
    fetchMock.mockImplementation((u: string) =>
      Promise.resolve(u.includes('/checkins') ? page([]) : json({ data: [monitor('a'), monitor('b')] }))
    )
    const slug = ref('a')
    const { monitor: m } = run(() => useCronJob(slug, 'shop'))
    await flushPromises()
    expect(m.value?.slug).toBe('a')

    slug.value = 'b'
    await flushPromises()
    expect(m.value?.slug).toBe('b')
  })
})
