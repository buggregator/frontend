import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventsStore, useProfileStore } from '../../stores'
import { EventTypes } from '../../types'
import { REST_API_URL } from './constants'
import { EventsLoadError, useEventsRequests } from './use-events-requests'

// The server clears events only through `DELETE /api/events` with a JSON body
// (`type`, `project`, `uuids`); `/api/events/preview` has no DELETE route.
describe('useEventsRequests: REST delete', () => {
  const fetchMock = vi.fn(() => Promise.resolve(new Response('{"status":true}')))

  beforeEach(() => {
    setActivePinia(createPinia())
    useEventsStore().setActiveProjectKey('default')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const lastCall = () => {
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    return { url, method: init.method, body: JSON.parse(String(init.body)) }
  }

  it('deleteAll clears the project through DELETE /api/events', async () => {
    await useEventsRequests().deleteAll()

    expect(lastCall()).toEqual({
      url: `${REST_API_URL}/api/events`,
      method: 'DELETE',
      body: { project: 'default' },
    })
  })

  it('deleteByType sends the type and the project to DELETE /api/events', async () => {
    await useEventsRequests().deleteByType(EventTypes.Sentry)

    expect(lastCall()).toEqual({
      url: `${REST_API_URL}/api/events`,
      method: 'DELETE',
      body: { type: 'sentry', project: 'default' },
    })
  })

  it('deleteAll and deleteByType pass keep_pinned', async () => {
    await useEventsRequests().deleteByType(EventTypes.Smtp, { keepPinned: true })
    expect(lastCall().body).toEqual({ type: 'smtp', project: 'default', keep_pinned: true })

    fetchMock.mockClear()
    await useEventsRequests().deleteAll({ keepPinned: true })
    expect(lastCall().body).toEqual({ project: 'default', keep_pinned: true })
  })

  it('deleteList sends the uuids and the project to DELETE /api/events', async () => {
    await useEventsRequests().deleteList(['a', 'b'])

    expect(lastCall()).toEqual({
      url: `${REST_API_URL}/api/events`,
      method: 'DELETE',
      body: { uuids: ['a', 'b'], project: 'default' },
    })
  })
})

describe('useEventsRequests: getAll', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the events of the answer', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{"data":[{"uuid":"a"}]}'))))

    expect(await useEventsRequests().getAll()).toEqual([{ uuid: 'a' }])
  })

  // An error answer used to become an empty list, which wiped the page.
  it('throws on an error answer instead of returning no events', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{"error":"db"}', { status: 500 }))))

    await expect(useEventsRequests().getAll()).rejects.toBeInstanceOf(EventsLoadError)
  })

  // Audit 1.10: the token was read once, when the composable was created.
  it('sends the token the store holds at request time', async () => {
    const fetchMock = vi.fn((..._args: unknown[]) => Promise.resolve(new Response('{"data":[]}')))
    vi.stubGlobal('fetch', fetchMock)
    const requests = useEventsRequests()
    useProfileStore().setToken('late-token')

    await requests.getAll()

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.headers).toEqual({ 'X-Auth-Token': 'late-token' })
  })
})
