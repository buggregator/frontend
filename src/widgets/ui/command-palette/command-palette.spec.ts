import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useEventsStore, useSettingsStore } from '@/shared/stores'
import { EventTypes, RouteName } from '@/shared/types'
import CommandPalette from './command-palette.vue'

const memoryStorage = () => {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, String(value)),
    removeItem: (key: string) => void items.delete(key),
    clear: () => items.clear(),
  }
}

const setup = async () => {
  const page = { template: '<div/>' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: RouteName.Home, component: page },
      { path: '/settings', name: RouteName.Settings, component: page },
      { path: '/mock-server', name: RouteName.MockServer, component: page },
      { path: '/favorites', name: RouteName.Favorites, component: page },
      { path: '/:type', name: RouteName.EventList, component: page },
    ],
  })
  await router.push('/')
  useSettingsStore().availableEvents = Object.values(EventTypes)
  const wrapper = mount(CommandPalette, { global: { plugins: [router] }, attachTo: document.body })
  const input = () => document.querySelector<HTMLInputElement>('input[role="combobox"]')!
  const type = async (text: string) => {
    input().value = text
    input().dispatchEvent(new Event('input'))
    await flushPromises()
  }
  const key = async (k: string) => {
    input().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
    await flushPromises()
  }
  const options = () => Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'))
  const active = () => options().find((o) => o.getAttribute('aria-selected') === 'true')
  return { router, wrapper, input, type, key, options, active }
}

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{}', { status: 404 }))))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
  })

  it('is a labelled dialog with the focus in its search box', async () => {
    const { wrapper, input } = await setup()

    expect(document.querySelector('[role="dialog"]')?.getAttribute('aria-modal')).toBe('true')
    expect(document.activeElement).toBe(input())
    expect(input().getAttribute('aria-activedescendant')).toBe(document.querySelector('[role="option"]')?.id)
    wrapper.unmount()
  })

  it('finds pages and settings, best match first', async () => {
    const { wrapper, type, options } = await setup()

    await type('mock')

    expect(options()[0].dataset.command).toBe('page-mock-server')
    expect(options()[0].querySelector('mark')?.textContent).toBe('Mock')
    wrapper.unmount()
  })

  it('finds an event type by what it is for', async () => {
    const { wrapper, type, options } = await setup()

    await type('mail')

    expect(options()[0].dataset.command).toBe('page-smtp')
    wrapper.unmount()
  })

  it('moves with the arrows and opens with Enter', async () => {
    const { router, wrapper, type, key, active, input } = await setup()

    await type('settings')
    expect(active()?.dataset.command).toBe('page-settings')
    await key('ArrowDown')
    const second = active()!
    expect(input().getAttribute('aria-activedescendant')).toBe(second.id)
    await key('ArrowUp')
    await key('ArrowUp')
    expect(active()).toBe(document.querySelectorAll('[role="option"]')[document.querySelectorAll('[role="option"]').length - 1])
    await key('ArrowDown')

    await key('Enter')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe(RouteName.Settings)
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('takes you to the section of a setting', async () => {
    const { router, wrapper, type, key } = await setup()

    await type('phpstorm')
    await key('Enter')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/settings#editor')
    wrapper.unmount()
  })

  it('switches the project and marks the current one', async () => {
    const store = useEventsStore()
    store.projects.available = [
      { key: 'default', name: 'Default' },
      { key: 'shop', name: 'Shop backend' },
    ] as never
    store.setActiveProjectKey('default')
    const spy = vi.spyOn(store, 'setActiveProjectKey')
    const { wrapper, type, key, options } = await setup()

    await type('default')
    expect(options()[0].textContent).toContain('current')
    await type('shop')
    await key('Enter')

    expect(spy).toHaveBeenLastCalledWith('shop')
    wrapper.unmount()
  })

  it('sets the theme from an action', async () => {
    const { wrapper, type, key } = await setup()

    await type('theme: dark')
    await key('Enter')

    expect(useSettingsStore().themeMode).toBe('dark')
    wrapper.unmount()
  })

  it('says when nothing matches', async () => {
    const { wrapper, type, options } = await setup()

    await type('zzz')

    expect(options()).toHaveLength(0)
    expect(document.body.textContent).toContain('Nothing matches «zzz».')
    expect(document.querySelector('[role="status"]')?.textContent?.trim()).toBe('Nothing matches.')
    wrapper.unmount()
  })

  it('closes with Escape', async () => {
    const { wrapper, key } = await setup()

    await key('Escape')

    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })
})
