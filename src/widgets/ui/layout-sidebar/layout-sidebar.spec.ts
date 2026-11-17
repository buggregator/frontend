import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useServerUpdateStore } from '@/entities/server-update/lib'
import { availableStatus, restartingStatus, upToDateStatus } from '@/entities/server-update/mocks'
import { RouteName } from '@/shared/types'
import LayoutSidebar from './layout-sidebar.vue'

vi.mock('@/shared/lib/use-events', () => ({ useEvents: () => ({ getItemsCount: ref(() => 0) }) }))
vi.mock('@/entities/xdebug/lib', () => ({ useXdebugEnabled: () => ref(false) }))

const memoryStorage = () => {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, String(value)),
    removeItem: (key: string) => void items.delete(key),
    clear: () => items.clear(),
  }
}

const page = { template: '<div/>' }
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: RouteName.Home, component: page },
    { path: '/settings', name: RouteName.Settings, component: page },
    { path: '/favorites', name: RouteName.Favorites, component: page },
    { path: '/mock-server', name: RouteName.MockServer, component: page },
    { path: '/xdebug', name: RouteName.Xdebug, component: page },
    { path: '/:type', name: RouteName.EventList, component: page },
  ],
})

const render = () => mount(LayoutSidebar, { global: { plugins: [router] } })
const settingsLink = (wrapper: ReturnType<typeof render>) => wrapper.get('a[title="Settings"]')

describe('LayoutSidebar: server update', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    useServerUpdateStore().stop()
    vi.unstubAllGlobals()
  })

  it('puts a dot on Settings when a newer version is available, and says it', () => {
    useServerUpdateStore().setStatus(availableStatus)
    const link = settingsLink(render())

    expect(link.find('[data-test="settings-update-dot"]').exists()).toBe(true)
    expect(link.attributes('aria-label')).toBe('Settings, Buggregator 2.10.0 is available')
  })

  it('has no dot when up to date or on an older server', () => {
    useServerUpdateStore().setStatus(upToDateStatus)
    const link = settingsLink(render())

    expect(link.find('[data-test="settings-update-dot"]').exists()).toBe(false)
    expect(link.attributes('aria-label')).toBe('Settings')
  })

  it('shows the connection as reconnecting while the server restarts', () => {
    useServerUpdateStore().setStatus(restartingStatus)
    const wrapper = render()

    expect(wrapper.find('.layout-sidebar__connection-dot--restarting').exists()).toBe(true)
    expect(wrapper.get('.layout-sidebar__connection').attributes('title')).toBe('The server is restarting')
    expect(wrapper.get('.layout-sidebar__connection-label').text()).toBe('Reconnecting')
  })
})
