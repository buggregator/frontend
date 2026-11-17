import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useEventsStore } from '@/shared/stores'
import type { ServerEvent } from '@/shared/types'
import { useEmptyHome } from './use-empty-home'

const event = (uuid: string) =>
  ({ uuid, type: 'sentry', project: 'shop', timestamp: 1, payload: {} }) as unknown as ServerEvent<unknown>

describe('useEmptyHome', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const store = useEventsStore()
    store.setPeriod('all')
    store.setActiveProjectKey('shop')
  })

  const ready = (events: ServerEvent<unknown>[] = []) => {
    const store = useEventsStore()
    store.events = events
    store.setListState('ready')
  }

  it('shows on Home when the project has no events', async () => {
    const { show } = useEmptyHome(ref(true), vi.fn())
    expect(show.value).toBe(false) // still loading
    ready()
    await flushPromises()
    expect(show.value).toBe(true)
  })

  it('not on another page, and not while a search hides events', async () => {
    const isHome = ref(false)
    const { show } = useEmptyHome(isHome, vi.fn())
    ready()
    await flushPromises()
    expect(show.value).toBe(false)

    useEventsStore().searchQuery = 'boom'
    isHome.value = true
    await flushPromises()
    expect(show.value).toBe(false)
  })

  it('stays after the first event until the person opens the list', async () => {
    const { show, openList } = useEmptyHome(ref(true), vi.fn())
    ready()
    await flushPromises()
    useEventsStore().events = [event('a')]
    await flushPromises()
    expect(show.value).toBe(true)

    openList()
    expect(show.value).toBe(false)
  })

  it('with a narrowed period asks the server whether older events exist', async () => {
    useEventsStore().setPeriod('24h')
    const older = vi.fn().mockResolvedValue(true)
    const { show } = useEmptyHome(ref(true), older)
    ready()
    await flushPromises()
    expect(older).toHaveBeenCalledTimes(1)
    expect(show.value).toBe(false)
  })

  it('with a narrowed period and nothing on the server: the panel', async () => {
    useEventsStore().setPeriod('24h')
    const { show } = useEmptyHome(ref(true), vi.fn().mockResolvedValue(false))
    ready()
    await flushPromises()
    expect(show.value).toBe(true)
  })

  it('a project with events: the usual page, and switching decides again', async () => {
    const { show } = useEmptyHome(ref(true), vi.fn())
    ready([event('a')])
    await flushPromises()
    expect(show.value).toBe(false)

    const store = useEventsStore()
    store.setActiveProjectKey('billing')
    store.setListState('loading')
    store.events = []
    await flushPromises()
    store.setListState('ready')
    await flushPromises()
    expect(show.value).toBe(true)
  })
})
