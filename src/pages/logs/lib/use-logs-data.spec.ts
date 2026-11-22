import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia, storeToRefs } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import { useEventsStore } from '@/shared/stores'
import { LOGS_PAGE_SIZE } from './logs-api'
import { parseLogsQuery, type LogsFilters } from './logs-filters'
import { logLine } from './test-utils'
import { useLogsData } from './use-logs-data'

const json = (body: unknown, status = 200) =>
  Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  )

type Reply = {
  list?: unknown[]
  facets?: unknown
  base?: unknown
  any?: unknown[]
  status?: number
}

describe('useLogsData', () => {
  let reply: Reply
  const fetchMock = vi.fn((url: string) => {
    const u = new URL(url, 'http://x')
    if (reply.status) return json({}, reply.status)
    if (u.pathname.endsWith('/facets'))
      return json({
        data:
          u.searchParams.has('q') || u.searchParams.has('level')
            ? reply.facets
            : (reply.base ?? reply.facets)
      })
    if (u.pathname.endsWith('/histogram')) return json({ bucket: 60, data: [] })
    if (u.searchParams.get('limit') === '1') return json({ data: reply.any ?? [] })
    return json({ data: reply.list ?? [] })
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockClear()
    reply = {}
  })
  afterEach(() => vi.unstubAllGlobals())

  const start = (query: Record<string, string | string[]> = {}) => {
    const filters = ref<LogsFilters>(parseLogsQuery(query))
    const store = useEventsStore()
    store.setActiveProjectKey('default')
    const { activeProjectKey: project } = storeToRefs(store)
    const data = effectScope().run(() => useLogsData(filters, project, 10))!
    return { filters, data }
  }

  it('loads the lines and counts matches over the picked levels, of all lines in the window', async () => {
    reply = {
      list: [logLine('a'), logLine('b')],
      facets: {
        level: [
          { value: 'error', count: 6 },
          { value: 'info', count: 30 }
        ],
        trace: [{ value: 't', count: 9 }]
      },
      base: {
        level: [
          { value: 'error', count: 10 },
          { value: 'info', count: 90 }
        ]
      }
    }
    const { data } = start({ q: 'card', level: 'error' })
    expect(data.state.value).toBe('loading')
    await flushPromises()
    expect(data.state.value).toBe('ready')
    expect(data.rows.value.map((e) => e.uuid)).toEqual(['a', 'b'])
    expect(data.matchCount.value).toBe(6)
    expect(data.totalCount.value).toBe(100)
    expect(data.hasAnyLogs.value).toBe(true)
  })

  it('an empty window of a project with no log at all is the first run', async () => {
    reply = { list: [], facets: {}, any: [] }
    const { data } = start()
    await flushPromises()
    expect(data.hasAnyLogs.value).toBe(false)

    reply = { list: [], facets: {}, any: [{}] }
    await data.load()
    expect(data.hasAnyLogs.value).toBe(true)
  })

  it('loads again when a filter or the project changes; a late reply is dropped', async () => {
    reply = { list: [logLine('old')], facets: {} }
    const { filters, data } = start()
    filters.value = parseLogsQuery({ q: 'x' })
    reply = { list: [logLine('new')], facets: {} }
    await flushPromises()
    expect(data.rows.value.map((e) => e.uuid)).toEqual(['new'])

    useEventsStore().setActiveProjectKey('shop')
    await flushPromises()
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes('project=shop'))).toBe(true)
  })

  it('shows an error state when the server fails', async () => {
    reply = { status: 500 }
    const { data } = start()
    await flushPromises()
    expect(data.state.value).toBe('error')
    expect(data.error.value).toBe('The server answered 500')
  })

  it('live lines that match go on top, newest first, and the counts follow', async () => {
    vi.useFakeTimers()
    reply = { list: [logLine('a')], facets: {} }
    const { data } = start({ level: ['error', 'critical'] })
    await flushPromises()
    const calls = fetchMock.mock.calls.length

    data.addLines([
      logLine('x', { level: 400 }),
      logLine('skip'),
      logLine('y', { level: 500 }),
      logLine('a', { level: 400 })
    ])
    expect(data.rows.value.map((e) => e.uuid)).toEqual(['y', 'x', 'a'])
    vi.advanceTimersByTime(20)
    await flushPromises()
    expect(fetchMock.mock.calls.length).toBeGreaterThan(calls)
    vi.useRealTimers()
  })

  it('loads older lines from where the server list ended', async () => {
    reply = { list: Array.from({ length: LOGS_PAGE_SIZE }, (_, i) => logLine(`p${i}`)), facets: {} }
    const { data } = start()
    await flushPromises()
    expect(data.hasMore.value).toBe(true)
    data.addLines([logLine('live')])

    reply = { list: [logLine('older')], facets: {} }
    await data.loadMore()
    expect(String(fetchMock.mock.calls.at(-1)?.[0])).toContain(`offset=${LOGS_PAGE_SIZE}`)
    expect(data.rows.value.at(-1)?.uuid).toBe('older')
    expect(data.hasMore.value).toBe(false)
  })
})
