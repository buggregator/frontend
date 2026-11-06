import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PAGE_TYPES } from '../../constants'
import { EventTypes, type ServerEvent } from '../../types'
import { useSettingsStore } from '../settings'
import { useEventsStore } from './events-store'

const event = (uuid: string, type: string, extra: Record<string, unknown> = {}) =>
  ({ uuid, type, project: 'default', timestamp: 1, payload: {}, ...extra }) as unknown as ServerEvent<unknown>

const ids = (events: ServerEvent<unknown>[]) => events.map(({ uuid }) => uuid)

describe('eventsStore', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
    useSettingsStore().availableEvents = Object.values(EventTypes)
  })

  // Audit 1.8: the pause cache was the module's own initial object. Pausing
  // pushed into it, so a later "reset" brought the old ids back.
  describe('pause cache', () => {
    it('starts empty again after Clear, also in a new store', () => {
      const store = useEventsStore()
      store.addList([event('a', 'smtp')])
      store.addCachedByType(PAGE_TYPES.Smtp)
      store.removeAll()

      expect(store.cachedIds[PAGE_TYPES.Smtp]).toEqual([])

      store.addList([event('b', 'smtp')])
      store.addCachedByType(PAGE_TYPES.Smtp)
      sessionStorage.clear()
      setActivePinia(createPinia())

      expect(useEventsStore().cachedIds[PAGE_TYPES.Smtp]).toEqual([])
    })

    it('ends the pause on Clear even when pinned events stay', () => {
      const store = useEventsStore()
      store.addList([event('a', 'smtp'), event('b', 'smtp')])
      store.addLockedIds('a')
      store.addCachedByType(PAGE_TYPES.Smtp)

      store.removeAll()

      expect(ids(store.events)).toEqual(['a'])
      expect(store.cachedIds[PAGE_TYPES.Smtp]).toEqual([])
    })

    it('forgets deleted ids in the pause cache when pinned events exist', () => {
      const store = useEventsStore()
      store.addList([event('a', 'smtp'), event('b', 'smtp')])
      store.addLockedIds('a')
      store.addCachedByType(PAGE_TYPES.Smtp)

      store.removeByIds(['b'])

      expect(store.cachedIds[PAGE_TYPES.Smtp]).toEqual(['a'])
    })

    it('forgets the ids of a cleared type in the pause cache', () => {
      const store = useEventsStore()
      store.addList([event('a', 'smtp'), event('b', 'sentry')])
      store.addCachedByType(PAGE_TYPES.ALL_EVENT_TYPES)

      store.removeByType(EventTypes.Smtp)

      expect(store.cachedIds[PAGE_TYPES.ALL_EVENT_TYPES]).toEqual(['b'])
      expect(store.eventsCounts(EventTypes.Smtp)).toBe(0)
    })
  })

  // Audit 1.4 and 1.5: the server's list is the truth after a reconnect or a
  // clear made elsewhere.
  describe('syncFromServer', () => {
    it('replaces the list and takes pins from the server', () => {
      const store = useEventsStore()
      store.addList([event('old', 'smtp')])
      store.addLockedIds('old')

      store.syncFromServer([event('a', 'smtp', { is_pinned: true }), event('b', 'sentry')])

      expect(ids(store.events)).toEqual(['a', 'b'])
      expect(store.lockedIds).toEqual(['a'])
      expect(store.eventsCounts(EventTypes.Sentry)).toBe(1)
    })

    it('empties the list when the server has nothing, pinned ones too', () => {
      const store = useEventsStore()
      store.addList([event('a', 'smtp')])
      store.addLockedIds('a')

      store.syncFromServer([])

      expect(store.events).toEqual([])
      expect(store.lockedIds).toEqual([])
    })
  })

  describe('dropByIds', () => {
    it('removes events the server deleted, even pinned ones', () => {
      const store = useEventsStore()
      store.addList([event('a', 'smtp'), event('b', 'smtp')])
      store.addLockedIds('a')
      store.addCachedByType(PAGE_TYPES.Smtp)

      store.dropByIds(['a'])

      expect(ids(store.events)).toEqual(['b'])
      expect(store.lockedIds).toEqual([])
      expect(store.cachedIds[PAGE_TYPES.Smtp]).toEqual(['b'])
    })
  })

  // Review of #308: a list reply was applied whole, whatever its age.
  describe('list loads', () => {
    it('applies the latest reply and ignores an older one', () => {
      const store = useEventsStore()
      store.setActiveProjectKey('p1')
      const old = store.startListLoad()
      const latest = store.startListLoad()

      expect(store.applyListLoad(latest, [event('new', 'smtp')])).toBe(true)
      expect(store.applyListLoad(old, [event('old', 'smtp')])).toBe(false)
      expect(ids(store.events)).toEqual(['new'])
    })

    it('ignores a reply for a project or period left meanwhile', () => {
      const store = useEventsStore()
      store.setActiveProjectKey('p1')
      const load = store.startListLoad()
      store.setActiveProjectKey('p2')

      expect(store.applyListLoad(load, [event('a', 'smtp')])).toBe(false)

      const second = store.startListLoad()
      store.setPeriod('1h')
      expect(store.applyListLoad(second, [event('a', 'smtp')])).toBe(false)
      expect(store.events).toEqual([])
    })

    it('keeps an event that arrived live while the request ran', () => {
      const store = useEventsStore()
      store.setActiveProjectKey('p1')
      const load = store.startListLoad()
      store.addList([event('live', 'smtp')])

      store.applyListLoad(load, [event('a', 'smtp')])

      expect(ids(store.events)).toEqual(['live', 'a'])
    })

    it('keeps a delete and a pin made while the request ran', () => {
      const store = useEventsStore()
      store.setActiveProjectKey('p1')
      store.addList([event('a', 'smtp'), event('b', 'smtp'), event('c', 'smtp')])
      const load = store.startListLoad()
      store.removeByIds(['a'])
      store.addLockedIds('b')

      store.applyListLoad(load, [event('a', 'smtp'), event('b', 'smtp'), event('c', 'smtp', { is_pinned: true })])

      expect(ids(store.events).sort()).toEqual(['b', 'c'])
      expect(store.lockedIds.sort()).toEqual(['b', 'c'])
    })

    it('keeps an unpin made while the request ran', () => {
      const store = useEventsStore()
      store.setActiveProjectKey('p1')
      store.addList([event('a', 'smtp')])
      store.addLockedIds('a')
      const load = store.startListLoad()
      store.removeLockedIds('a')

      store.applyListLoad(load, [event('a', 'smtp', { is_pinned: true })])

      expect(store.lockedIds).toEqual([])
    })
  })
})
