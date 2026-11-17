import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { useEventsStore, useSettingsStore } from '../../stores'
import { EventTypes, LocalStorageKeys, type EventType, type ServerEvent } from '../../types'
import { useSeenEvents } from './use-seen-events'

const memoryStorage = () => {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, String(value)),
    removeItem: (key: string) => void items.delete(key),
    clear: () => items.clear(),
  }
}

let n = 0
const ev = (type: EventType, timestamp: number): ServerEvent<unknown> => ({
  uuid: `e${++n}`,
  type,
  payload: {},
  project: 'default',
  timestamp,
})

const viewing = ref<EventType[]>([])

const mountIt = () => {
  let api!: ReturnType<typeof useSeenEvents>
  const C = defineComponent({
    setup() {
      api = useSeenEvents(viewing)
      return () => h('div')
    },
  })
  const wrapper = mount(C)
  return { wrapper, api: () => api }
}

const loaded = (events: ServerEvent<unknown>[]) => {
  useSettingsStore().availableEvents = Object.values(EventTypes)
  const store = useEventsStore()
  store.setAvailableProjects([{ key: 'default', name: 'Default', is_default: true }])
  store.addList(events)
  store.setListState('ready')
}

describe('useSeenEvents', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }))
    setActivePinia(createPinia())
    viewing.value = []
  })

  afterEach(() => vi.unstubAllGlobals())

  it('counts nothing as new on the first visit: what is already there was there before', async () => {
    const { api } = mountIt()
    loaded([ev(EventTypes.Sentry, 10), ev(EventTypes.Sentry, 11), ev(EventTypes.Smtp, 12)])
    await nextTick()

    expect(api().newCount(EventTypes.Sentry)).toBe(0)
    expect(api().newCount(EventTypes.Smtp)).toBe(0)
  })

  it('counts events that arrive later, per type, also for a type that had none', async () => {
    const { api } = mountIt()
    loaded([ev(EventTypes.Sentry, 10)])
    await nextTick()

    useEventsStore().addList([ev(EventTypes.Sentry, 20), ev(EventTypes.Sentry, 21), ev(EventTypes.Monolog, 22)])
    await nextTick()

    expect(api().newCount(EventTypes.Sentry)).toBe(2)
    expect(api().newCount(EventTypes.Monolog)).toBe(1)
    expect(api().newCount(EventTypes.Smtp)).toBe(0)
  })

  it('looking at a type clears its count and keeps it clear while new ones arrive', async () => {
    const { api } = mountIt()
    loaded([ev(EventTypes.Sentry, 10)])
    await nextTick()
    useEventsStore().addList([ev(EventTypes.Sentry, 20), ev(EventTypes.Smtp, 21)])
    await nextTick()

    viewing.value = [EventTypes.Sentry]
    await nextTick()
    expect(api().newCount(EventTypes.Sentry)).toBe(0)
    expect(api().newCount(EventTypes.Smtp)).toBe(1)

    useEventsStore().addList([ev(EventTypes.Sentry, 30)])
    await nextTick()
    expect(api().newCount(EventTypes.Sentry)).toBe(0)
  })

  it('remembers what was seen across a reload', async () => {
    const first = mountIt()
    loaded([ev(EventTypes.Sentry, 10)])
    await nextTick()
    first.wrapper.unmount()

    setActivePinia(createPinia())
    const { api } = mountIt()
    loaded([ev(EventTypes.Sentry, 10), ev(EventTypes.Sentry, 40)])
    await nextTick()

    expect(api().newCount(EventTypes.Sentry)).toBe(1)
    expect(JSON.parse(localStorage.getItem(LocalStorageKeys.SeenEvents)!)).toHaveProperty('default')
  })

  it('never counts events without a timestamp', async () => {
    const { api } = mountIt()
    loaded([])
    await nextTick()
    useEventsStore().addList([ev(EventTypes.RayDump, 0)])
    await nextTick()

    expect(api().newCount(EventTypes.RayDump)).toBe(0)
  })
})
