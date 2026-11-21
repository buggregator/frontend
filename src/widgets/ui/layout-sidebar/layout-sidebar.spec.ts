import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useServerUpdateStore } from '@/entities/server-update/lib'
import { availableStatus, restartingStatus, upToDateStatus } from '@/entities/server-update/mocks'
import { useEventsStore, useProfileStore, useSettingsStore } from '@/shared/stores'
import { LocalStorageKeys, RouteName } from '@/shared/types'
import LayoutSidebar from './layout-sidebar.vue'

const totals = ref<Record<string, number>>({})
const fresh = ref<Record<string, number>>({})
vi.mock('@/shared/lib/use-events', () => ({
  useEvents: () => ({ getItemsCount: computed(() => (type: string) => totals.value[type] ?? 0) }),
}))
vi.mock('@/shared/lib/use-seen-events', () => ({
  useSeenEvents: () => ({ newCount: (type: string) => fresh.value[type] ?? 0 }),
}))
vi.mock('@/entities/xdebug/lib', () => ({ useXdebugEnabled: () => ref(false) }))
const codeGraph = ref(false)
vi.mock('@/entities/code-graph/lib', () => ({ useCodeGraphEnabled: () => codeGraph }))

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
    { path: '/code', name: RouteName.Code, component: page },
    { path: '/login', name: RouteName.Login, component: page },
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
    useSettingsStore().availableEvents = ['sentry', 'http-dump', 'smtp']
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

  it('draws each project as the pixel bug of its key, the same bug on the switcher', async () => {
    const store = useEventsStore()
    store.setAvailableProjects(projects)
    store.setActiveProjectKey('shop')
    const wrapper = mount(LayoutSidebar, { global: { plugins: [router] }, attachTo: document.body })
    const switcherBug = wrapper.get('[data-test="project-switcher"] [data-test="project-avatar"]').html()
    await wrapper.get('[data-test="project-switcher"]').trigger('click')

    const rows = wrapper.findAll('[role="menuitemradio"]')
    const bugs = rows.map((row) => row.get('[data-test="project-avatar"]').html())
    expect(bugs[1]).toBe(switcherBug)
    expect(new Set(bugs).size).toBe(3)
    expect(wrapper.html()).not.toContain('linear-gradient')
    wrapper.unmount()
  })
})

describe('LayoutSidebar: groups and «new» badges', () => {
  beforeEach(async () => {
    vi.stubGlobal('localStorage', memoryStorage())
    narrowScreen(false)
    setActivePinia(createPinia())
    useSettingsStore().availableEvents = ['sentry', 'profiler', 'inspector', 'ray', 'http-dump', 'smtp', 'monolog']
    totals.value = { sentry: 5, ray: 2, smtp: 4 }
    fresh.value = { sentry: 3 }
    await router.push('/favorites')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    totals.value = {}
    fresh.value = {}
  })

  const expanded = () => {
    localStorage.setItem(LocalStorageKeys.SidebarCollapsed, 'false')
    return render()
  }

  it('puts event types in named groups, tools last', () => {
    const groups = expanded().findAll('[role="group"]')
    const names = groups.map((g) => g.get('.layout-sidebar__group-title').text())

    expect(names).toEqual(['Errors & performance', 'Dumps', 'Mail & logs', 'Tools'])
    expect(groups[0].findAll('a').map((a) => a.attributes('title'))).toEqual(['Sentry', 'Profiler', 'Inspector'])
    expect(groups[3].find('a[title="Mock server"]').exists()).toBe(true)
  })

  it('shows Code under Tools only when the server has code graph roots', () => {
    codeGraph.value = false
    expect(expanded().find('a[title="Code"]').exists()).toBe(false)
    codeGraph.value = true
    expect(expanded().get('a[title="Code"]').attributes('href')).toBe('/code')
    codeGraph.value = false
  })

  // The server serves mocks from the http-dump module (#6019).
  it('has no Mock server link when the server has http-dump off', () => {
    useSettingsStore().availableEvents = ['sentry', 'smtp']
    expect(expanded().find('a[title="Mock server"]').exists()).toBe(false)
  })

  it('shows «N new» and the total, and says both', () => {
    const sentry = expanded().get('a[title="Sentry"]')

    expect(sentry.get('[data-test="nav-new"]').text()).toBe('3 new')
    expect(sentry.get('.layout-sidebar__count').text()).toBe('5')
    expect(sentry.attributes('aria-label')).toBe('Sentry, 3 new, 5 events')
  })

  it('keeps the «new» number in the collapsed menu, without the word', () => {
    const sentry = render().get('a[title="Sentry"]')

    expect(sentry.get('[data-test="nav-new"]').text()).toBe('3')
    expect(sentry.find('.layout-sidebar__dot').exists()).toBe(false)
  })

  it('shows no badge where nothing is new, and dims types without events', () => {
    const wrapper = expanded()

    expect(wrapper.get('a[title="Ray"]').find('[data-test="nav-new"]').exists()).toBe(false)
    expect(wrapper.get('a[title="Profiler"]').classes()).toContain('layout-sidebar__link--empty')
    expect(wrapper.get('a[title="Sentry"]').classes()).not.toContain('layout-sidebar__link--empty')
  })

  it('leaves out entries turned off in Settings › Menu, with their «new» badge and an emptied group', () => {
    useSettingsStore().hiddenMenuItems = ['sentry', 'profiler', 'inspector', 'mock-server']
    const wrapper = expanded()

    expect(wrapper.find('a[title="Sentry"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="nav-new"]').exists()).toBe(false)
    expect(wrapper.find('a[title="Mock server"]').exists()).toBe(false)
    expect(wrapper.findAll('.layout-sidebar__group-title').map((t) => t.text())).toEqual(['Dumps', 'Mail & logs'])
    // The fixed entries stay.
    expect(wrapper.find('a[title="Events"]').exists()).toBe(true)
    expect(wrapper.find('a[title="Favorites"]').exists()).toBe(true)
    expect(wrapper.find('a[title="Settings"]').exists()).toBe(true)
  })

  it('shows «new» even with event counts turned off', () => {
    useSettingsStore().isVisibleEventCounts = false
    const sentry = expanded().get('a[title="Sentry"]')

    expect(sentry.find('[data-test="nav-new"]').exists()).toBe(true)
    expect(sentry.find('.layout-sidebar__count').exists()).toBe(false)
  })
})

describe('LayoutSidebar: logout', () => {
  beforeEach(async () => {
    vi.stubGlobal('localStorage', memoryStorage())
    narrowScreen(false)
    setActivePinia(createPinia())
    await router.push('/settings')
  })

  afterEach(() => vi.unstubAllGlobals())

  it('drops the token and goes to the login page', async () => {
    useSettingsStore().isAuthEnabled = true
    useProfileStore().setProfile({ username: 'ann', email: 'ann@example.test', avatar: 'https://example.test/a.png' })
    const wrapper = render()

    await wrapper.get('[aria-label="User profile menu"]').trigger('click')
    const logout = wrapper.findAll('button').find((b) => b.text().includes('Logout'))!
    await logout.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe(RouteName.Login)
  })
})
