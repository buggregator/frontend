import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventsStore } from '../../stores'
import { EventTypes } from '../../types'
import { REST_API_URL } from './constants'
import { useEventsRequests } from './use-events-requests'

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

  it('deleteList sends the uuids and the project to DELETE /api/events', async () => {
    await useEventsRequests().deleteList(['a', 'b'])

    expect(lastCall()).toEqual({
      url: `${REST_API_URL}/api/events`,
      method: 'DELETE',
      body: { uuids: ['a', 'b'], project: 'default' },
    })
  })
})
