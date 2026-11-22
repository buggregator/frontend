import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { REST_API_URL } from '@/shared/lib/io'
import { useEventsStore, useProfileStore } from '@/shared/stores'
import { LogsLoadError, logsParams, useLogsApi } from './logs-api'
import { parseLogsQuery } from './logs-filters'

const json = (body: unknown, status = 200) =>
  Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  )

describe('logsParams', () => {
  const f = parseLogsQuery({
    q: 'order',
    level: ['error', 'warning'],
    channel: 'payments',
    trace: 't1',
    window: '3h'
  })

  it('sends every filter, repeatable ones repeated', () => {
    expect(logsParams(f, 'shop').toString()).toBe(
      'type=monolog&project=shop&window=3h&trace=t1&level=error&level=warning&channel=payments&q=order'
    )
  })

  it('without search: the window and the trace only; all time has no window', () => {
    expect(logsParams({ ...f, window: 'all' }, undefined, { search: false }).toString()).toBe(
      'type=monolog&trace=t1'
    )
  })
})

describe('useLogsApi', () => {
  const fetchMock = vi.fn((_url: string, _init?: RequestInit) => json({ data: [] }))
  const url = (i = 0) => String(fetchMock.mock.calls[i][0]).replace(REST_API_URL, '')

  beforeEach(() => {
    setActivePinia(createPinia())
    useEventsStore().setActiveProjectKey('shop')
    useProfileStore().setToken('t0k')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockClear()
  })
  afterEach(() => vi.unstubAllGlobals())

  const f = parseLogsQuery({ q: 'card' })

  it('lists a page of lines with the token and the project', async () => {
    await useLogsApi().list(f, 200)
    expect(url()).toBe(
      '/api/events/preview?type=monolog&project=shop&window=1h&q=card&limit=200&offset=200'
    )
    expect((fetchMock.mock.calls[0][1]?.headers as Record<string, string>)['X-Auth-Token']).toBe(
      't0k'
    )
  })

  it('reads facets and the histogram with its bucket', async () => {
    fetchMock.mockImplementationOnce(() =>
      json({ data: { level: [{ value: 'error', count: 2 }] }, keys: ['level'] })
    )
    expect(await useLogsApi().facets(f)).toEqual({ level: [{ value: 'error', count: 2 }] })

    fetchMock.mockImplementationOnce(() => json({ bucket: 1800, data: [{ t: 1, count: 2 }] }))
    expect(await useLogsApi().histogram(f)).toEqual({ bucket: 1800, data: [{ t: 1, count: 2 }] })
    expect(url(1)).toBe(
      '/api/events/histogram?type=monolog&project=shop&window=1h&q=card&bucket=60'
    )
  })

  it('asks whether the project has any log, whatever the window', async () => {
    fetchMock.mockImplementationOnce(() => json({ data: [{}] }))
    expect(await useLogsApi().hasAny()).toBe(true)
    expect(url()).toBe('/api/events/preview?type=monolog&limit=1&project=shop')
  })

  it('a failed answer throws', async () => {
    fetchMock.mockImplementationOnce(() => json({}, 500))
    await expect(useLogsApi().list(f)).rejects.toEqual(new LogsLoadError(500))
  })
})
