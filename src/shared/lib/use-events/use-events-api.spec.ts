import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventsStore, useSettingsStore } from '../../stores'
import { EventTypes, type ServerEvent } from '../../types'
import { useEventsApi } from './use-events-api'

const transport = {
  deleteEventsAll: vi.fn(() => Promise.resolve({ data: { status: true } })),
  deleteEventsByType: vi.fn(() => Promise.resolve({ data: { status: true } })),
  deleteEventsList: vi.fn(() => Promise.resolve({ data: { status: true } })),
  getEventsAll: vi.fn(() => Promise.resolve([])),
  getEvent: vi.fn(),
}

vi.mock('../use-api-transport', () => ({ useApiTransport: () => transport }))

const event = (uuid: string, type: string) =>
  ({ uuid, type, project: 'default', timestamp: 1, payload: {} }) as unknown as ServerEvent<unknown>

describe('useEventsApi: Clear with pinned events', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
    Object.values(transport).forEach((fn) => fn.mockClear())
    // addList keeps only types the server enabled; settings are not fetched here.
    useSettingsStore().availableEvents = Object.values(EventTypes)
    const store = useEventsStore()
    store.setActiveProjectKey('default')
    store.addList([event('a', 'smtp'), event('b', 'smtp'), event('c', 'sentry')])
    store.addLockedIds('a')
  })

  // Sending the loaded unpinned ids deleted at most what the browser had
  // (500 events); the server keeps pinned events itself with keep_pinned.
  it('clears everything but pinned events on the server, without an id list', async () => {
    await useEventsApi().removeAll()

    expect(transport.deleteEventsAll).toHaveBeenCalledWith({ keepPinned: true })
    expect(transport.deleteEventsList).not.toHaveBeenCalled()
    expect(useEventsStore().events.map(({ uuid }) => uuid)).toEqual(['a'])
  })

  it('clears one type but pinned events on the server, without an id list', async () => {
    await useEventsApi().removeByType(EventTypes.Smtp)

    expect(transport.deleteEventsByType).toHaveBeenCalledWith('smtp', { keepPinned: true })
    expect(transport.deleteEventsList).not.toHaveBeenCalled()
    expect(useEventsStore().events.map(({ uuid }) => uuid).sort()).toEqual(['a', 'c'])
  })

  it('asks for no keep_pinned when nothing is pinned', async () => {
    useEventsStore().removeLockedIds('a')

    await useEventsApi().removeAll()

    expect(transport.deleteEventsAll).toHaveBeenCalledWith({ keepPinned: false })
  })
})
