import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventsStore, useSettingsStore } from '../../stores'
import { EventTypes, type ServerEvent } from '../../types'
import { useEventsApi } from './use-events-api'

// What the WebSocket RPC bridge resolves with: the handler's HTTP status in
// `code`, for errors too.
const rpcAnswer = (code: number) => ({ data: { code, data: code < 300 ? { status: true } : { error: 'failed' } } })

const transport = {
  deleteEventsAll: vi.fn((): Promise<unknown> => Promise.resolve(rpcAnswer(200))),
  deleteEventsByType: vi.fn((): Promise<unknown> => Promise.resolve(rpcAnswer(200))),
  deleteEventsList: vi.fn((): Promise<unknown> => Promise.resolve(rpcAnswer(200))),
  getEventsAll: vi.fn((): Promise<ServerEvent<unknown>[]> => Promise.resolve([])),
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

  // A pin made in another tab, or on an event this browser has not loaded,
  // is not in this store; the server must keep it anyway.
  it('asks the server to keep pinned events even when this store knows no pins', async () => {
    useEventsStore().removeLockedIds('a')

    await useEventsApi().removeAll()
    await useEventsApi().removeByType(EventTypes.Smtp)

    expect(transport.deleteEventsAll).toHaveBeenCalledWith({ keepPinned: true })
    expect(transport.deleteEventsByType).toHaveBeenCalledWith('smtp', { keepPinned: true })
  })
})

// Audit 1.3: any answer counted as success, so a refused delete still emptied
// the list and the events came back after a reload.
describe('useEventsApi: the server refuses', () => {
  const ids = () => useEventsStore().events.map(({ uuid }) => uuid).sort()

  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
    Object.values(transport).forEach((fn) => fn.mockClear())
    useSettingsStore().availableEvents = Object.values(EventTypes)
    const store = useEventsStore()
    store.setActiveProjectKey('default')
    store.addList([event('a', 'smtp'), event('b', 'sentry')])
  })

  it('keeps the event when its delete answers 500', async () => {
    transport.deleteEventsList.mockResolvedValueOnce(rpcAnswer(500))

    expect(await useEventsApi().removeById('a')).toBe(false)
    expect(ids()).toEqual(['a', 'b'])
  })

  it('keeps the events when Clear fails on the network', async () => {
    transport.deleteEventsAll.mockRejectedValueOnce(new Error('offline'))

    expect(await useEventsApi().removeAll()).toBe(false)
    expect(ids()).toEqual(['a', 'b'])
  })

  it('keeps the type when its clear answers 403', async () => {
    transport.deleteEventsByType.mockResolvedValueOnce(rpcAnswer(403))

    expect(await useEventsApi().removeByType(EventTypes.Smtp)).toBe(false)
    expect(ids()).toEqual(['a', 'b'])
  })

  it('removes the event when the server says 200', async () => {
    expect(await useEventsApi().removeById('a')).toBe(true)
    expect(ids()).toEqual(['b'])
  })
})

// Audit 5.3: a 500 or a slow load looked like "waiting for events".
describe('useEventsApi: list load state', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
    Object.values(transport).forEach((fn) => fn.mockReset())
    useSettingsStore().availableEvents = Object.values(EventTypes)
  })

  it('is loading while the request runs, then ready', async () => {
    let resolve: (events: ServerEvent<unknown>[]) => void = () => {}
    transport.getEventsAll.mockReturnValueOnce(new Promise((r) => { resolve = r }))

    const loading = useEventsApi().getAll()
    expect(useEventsStore().listState).toBe('loading')

    resolve([event('a', 'smtp')])
    await loading
    expect(useEventsStore().listState).toBe('ready')
    expect(useEventsStore().events).toHaveLength(1)
  })

  it('keeps the events and reports the error when the load fails', async () => {
    useEventsStore().addList([event('a', 'smtp')])
    transport.getEventsAll.mockRejectedValueOnce({ status: 500 })

    await useEventsApi().getAll()

    expect(useEventsStore().listState).toBe('error')
    expect(useEventsStore().listError).toBe('The server answered 500.')
    expect(useEventsStore().events).toHaveLength(1)
  })

  it('lets only the latest of two loads land', async () => {
    let resolveOld: (events: ServerEvent<unknown>[]) => void = () => {}
    transport.getEventsAll
      .mockReturnValueOnce(new Promise((r) => { resolveOld = r }))
      .mockResolvedValueOnce([event('new', 'smtp')])

    const api = useEventsApi()
    const old = api.getAll()
    await api.getAll()
    resolveOld([event('old', 'smtp')])
    await old

    expect(useEventsStore().events.map(({ uuid }) => uuid)).toEqual(['new'])
  })
})
