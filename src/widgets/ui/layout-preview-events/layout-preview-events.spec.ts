import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { ALL_EVENT_TYPES } from '@/shared/constants'
import { useEventsStore } from '@/shared/stores'
import LayoutPreviewEvents from './layout-preview-events.vue'

const items = ref<unknown[]>([])
const pinned = ref<string[]>([])

vi.mock('@/shared/lib/use-events', () => ({
  useEvents: () => ({
    events: { items: computed(() => items.value), getAll: vi.fn() },
    lockedIds: { items: pinned },
    cachedEvents: { idsByType: ref({}), stopUpdatesByType: vi.fn(), runUpdatesByType: vi.fn() },
  }),
}))

vi.mock('../event-card-mapper', () => ({ EventCardMapper: { template: '<div class="card"/>' } }))

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', name: 'home', component: { template: '<div/>' } }],
})

const event = (uuid: string) => ({ uuid, type: 'smtp', payload: {}, searchable_text: 'hello' })

const render = async (props: Record<string, unknown> = {}) => {
  const wrapper = mount(LayoutPreviewEvents, {
    props: { type: ALL_EVENT_TYPES, title: '', ...props } as never,
    global: { plugins: [router] },
  })
  // the search is debounced by 150 ms
  await new Promise((r) => setTimeout(r, 200))
  await flushPromises()
  return wrapper
}

describe('LayoutPreviewEvents: empty, loading and error views', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
    items.value = []
    pinned.value = []
  })

  // Review of #309: Favorites with pins and a search matching none of them
  // said "No favorites yet".
  it('says nothing matches on Favorites with pins and an empty search', async () => {
    items.value = [event('a')]
    pinned.value = ['a']
    useEventsStore().searchQuery = 'zzz'
    useEventsStore().setListState('ready')

    const wrapper = await render({ title: 'Favorites', favoritesOnly: true })

    expect(wrapper.text()).toContain('No events match “zzz”')
    expect(wrapper.text()).not.toContain('No favorites yet')
  })

  it('says how to pin on empty Favorites', async () => {
    items.value = [event('a')]
    useEventsStore().setListState('ready')

    const wrapper = await render({ title: 'Favorites', favoritesOnly: true })

    expect(wrapper.text()).toContain('No favorites yet')
  })

  it('shows a skeleton, not the welcome, while the first load runs', async () => {
    useEventsStore().setListState('loading')

    const wrapper = await render()

    expect(wrapper.find('[aria-label="Loading events"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('waiting for events')
  })

  it('shows the load error instead of the welcome', async () => {
    useEventsStore().setListState('error', 'The server answered 500.')

    const wrapper = await render()

    expect(wrapper.get('[role="alert"]').text()).toContain('The server answered 500.')
    expect(wrapper.text()).not.toContain('waiting for events')
  })

  // Live events keep arriving after a failed load; they stay visible.
  it('keeps the cards under the error when events are loaded', async () => {
    items.value = [event('a'), event('b')]
    useEventsStore().setListState('error', 'The server answered 500.')

    const wrapper = await render()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.findAll('.card')).toHaveLength(2)
  })

  // Audit 2.3: the feed renders the cards near the screen, not all of them.
  it('renders a first page of a long feed and tells assistive tech the full size', async () => {
    items.value = Array.from({ length: 200 }, (_, i) => event(`e${i}`))
    useEventsStore().setListState('ready')

    const wrapper = await render()

    const cards = wrapper.findAll('.card')
    expect(cards.length).toBeLessThan(50)
    expect(cards[0].attributes('aria-posinset')).toBe('1')
    expect(cards[0].attributes('aria-setsize')).toBe('200')
    expect(wrapper.get('[role="feed"]').attributes('aria-label')).toContain('200 items')
  })
})
