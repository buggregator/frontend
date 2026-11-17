import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useServerUpdateStore } from '@/entities/server-update/lib'
import { availableStatus, restartingStatus, upToDateStatus } from '@/entities/server-update/mocks'
import { useEventsStore } from '@/shared/stores'
import { LocalStorageKeys, RouteName } from '@/shared/types'
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
    // It lands on About & updates.
    expect(link.attributes('href')).toBe('/settings#updates')
  })

  it('has no dot when up to date or on an older server', () => {
    useServerUpdateStore().setStatus(upToDateStatus)
    const link = settingsLink(render())

    expect(link.find('[data-test="settings-update-dot"]').exists()).toBe(false)
    expect(link.attributes('aria-label')).toBe('Settings')
    expect(link.attributes('href')).toBe('/settings')
  })

  it('shows the connection as reconnecting while the server restarts', () => {
    useServerUpdateStore().setStatus(restartingStatus)
    const wrapper = render()

    expect(wrapper.find('.layout-sidebar__connection-dot--restarting').exists()).toBe(true)
    expect(wrapper.get('.layout-sidebar__connection').attributes('title')).toBe('The server is restarting')
    expect(wrapper.get('.layout-sidebar__connection-label').text()).toBe('Reconnecting')
  })
})

const projects = [
  { key: 'default', name: 'Default', is_default: true },
  { key: 'shop', name: 'shop-api', is_default: false },
  { key: 'billing', name: 'billing', is_default: false },
]

const narrowScreen = (narrow: boolean) =>
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: narrow && query.includes('max-width'),
    addEventListener: () => {},
    removeEventListener: () => {},
  }))

const press = (el: Element, key: string) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))

describe('LayoutSidebar: menu and project switcher', () => {
  beforeEach(async () => {
    vi.stubGlobal('localStorage', memoryStorage())
    narrowScreen(false)
    setActivePinia(createPinia())
    await router.push('/')
  })

  afterEach(() => {
    useServerUpdateStore().stop()
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  const withProjects = () => {
    const store = useEventsStore()
    store.setAvailableProjects(projects)
    store.setActiveProjectKey('shop')
  }

  it('keeps «All events» in the menu when there are several projects', () => {
    withProjects()
    const wrapper = render()

    expect(wrapper.find('a[aria-label="All events"]').exists()).toBe(true)
  })

  it('names the current project on the switcher', () => {
    withProjects()
    localStorage.setItem(LocalStorageKeys.SidebarCollapsed, 'false')
    const wrapper = render()
    const button = wrapper.get('[data-test="project-switcher"]')

    expect(button.text()).toContain('shop-api')
    expect(button.attributes('aria-label')).toBe('Project: shop-api. Switch project')
  })

  it('opens the project list on the current project, moves with arrows, closes with Esc', async () => {
    withProjects()
    const wrapper = mount(LayoutSidebar, { global: { plugins: [router] }, attachTo: document.body })
    const button = wrapper.get('[data-test="project-switcher"]')

    await button.trigger('click')
    const menu = wrapper.get('[role="menu"][aria-label="Project list"]')
    expect(document.activeElement?.textContent).toContain('shop-api')

    press(document.activeElement!, 'ArrowDown')
    expect(document.activeElement?.textContent).toContain('billing')

    press(menu.element, 'Escape')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[aria-label="Project list"]').exists()).toBe(false)
    expect(document.activeElement).toBe(button.element)
    wrapper.unmount()
  })

  it.each([
    ['/settings', 'Settings'],
    ['/favorites', 'Favorites'],
    ['/mock-server', 'Mock server'],
    ['/', 'Events'],
  ])('marks the current page (%s) in the menu', async (path, title) => {
    await router.push(path)
    const wrapper = render()

    expect(wrapper.get(`a[title="${title}"]`).classes()).toContain('layout-sidebar__link--active')
  })

  it('below 1280 px the expand button opens the menu over the page, and Esc closes it', async () => {
    narrowScreen(true)
    const wrapper = mount(LayoutSidebar, { global: { plugins: [router] }, attachTo: document.body })
    const aside = wrapper.get('aside')
    expect(aside.classes()).toContain('layout-sidebar--collapsed')

    await wrapper.get('button[aria-label="Expand sidebar"]').trigger('click')
    expect(aside.classes()).toContain('layout-sidebar--overlay')
    expect(aside.classes()).not.toContain('layout-sidebar--collapsed')
    // Opening it does not change the remembered desktop choice.
    expect(localStorage.getItem(LocalStorageKeys.SidebarCollapsed)).toBeNull()

    press(aside.element, 'Escape')
    await wrapper.vm.$nextTick()
    expect(aside.classes()).not.toContain('layout-sidebar--overlay')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Expand sidebar')
    wrapper.unmount()
  })

  it('closes the overlay menu when a page is picked', async () => {
    narrowScreen(true)
    const wrapper = render()
    await wrapper.get('button[aria-label="Expand sidebar"]').trigger('click')

    await router.push('/settings')
    await wrapper.vm.$nextTick()
    expect(wrapper.get('aside').classes()).not.toContain('layout-sidebar--overlay')
  })
})

describe('LayoutSidebar: project list rows', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    narrowScreen(false)
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('ticks the current project and shows the key only when it differs from the name', async () => {
    const store = useEventsStore()
    store.setAvailableProjects([
      { key: 'default', name: 'Default', is_default: true },
      { key: 'shop', name: 'shop-api', is_default: false },
    ])
    store.setActiveProjectKey('shop')
    const wrapper = mount(LayoutSidebar, { global: { plugins: [router] }, attachTo: document.body })
    await wrapper.get('[data-test="project-switcher"]').trigger('click')

    const [def, shop] = wrapper.findAll('[role="menuitemradio"]')
    expect(shop.attributes('aria-current')).toBe('true')
    expect(shop.find('[data-test="project-current"]').exists()).toBe(true)
    expect(def.attributes('aria-current')).toBeUndefined()
    expect(def.find('[data-test="project-current"]').exists()).toBe(false)

    // «default» repeats «Default»: no key line. «shop» differs from «shop-api»: shown.
    expect(def.find('.layout-sidebar__dropdown-item-text-key').exists()).toBe(false)
    expect(shop.get('.layout-sidebar__dropdown-item-text-key').text()).toBe('shop')
    wrapper.unmount()
  })
})
