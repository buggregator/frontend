import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useSettingsStore } from '../../stores'
import { EventTypes, RouteName } from '../../types'
import { isAssistOpen } from '../assist'
import { isCommandPaletteOpen } from '../command-palette'
import { isShortcutsOverlayOpen, useGlobalShortcuts } from './use-global-shortcuts'

const memoryStorage = () => {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, String(value)),
    removeItem: (key: string) => void items.delete(key),
    clear: () => items.clear(),
  }
}

const press = (key: string, init: KeyboardEventInit = {}) =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }))

const setup = async () => {
  const page = { template: '<div/>' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: RouteName.Home, component: page },
      { path: '/favorites', name: RouteName.Favorites, component: page },
      { path: '/:type', name: RouteName.EventList, component: page },
    ],
  })
  await router.push('/smtp')
  useSettingsStore().availableEvents = Object.values(EventTypes)
  const Host = defineComponent({
    setup() {
      useGlobalShortcuts()
      return () => h('div')
    },
  })
  const wrapper = mount(Host, { global: { plugins: [router] }, attachTo: document.body })
  return { router, wrapper }
}

describe('useGlobalShortcuts', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
    isShortcutsOverlayOpen.value = false
    isCommandPaletteOpen.value = false
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('goes home with 0', async () => {
    const { router, wrapper } = await setup()

    press('0')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/')
    wrapper.unmount()
  })

  it.each([['ctrlKey'], ['metaKey'], ['altKey']])('ignores 0, 1 and f pressed with %s', async (modifier) => {
    const { router, wrapper } = await setup()

    press('0', { [modifier]: true })
    press('1', { [modifier]: true })
    press('f', { [modifier]: true })
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/smtp')
    wrapper.unmount()
  })

  it('ignores single-key shortcuts when they are turned off', async () => {
    useSettingsStore().changeSingleKeyShortcuts()
    const { router, wrapper } = await setup()

    press('0')
    press('f')
    press('?', { shiftKey: true })
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/smtp')
    expect(isShortcutsOverlayOpen.value).toBe(false)
    wrapper.unmount()
  })

  // Idea 5: Ctrl/⌘+K opens the «Go to» window, also from a text field and with
  // single-key shortcuts off (it has a modifier).
  it('opens and closes the Go to window with Ctrl+K or ⌘+K', async () => {
    const { wrapper } = await setup()
    useSettingsStore().isSingleKeyShortcutsEnabled = false
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    press('k', { ctrlKey: true })
    expect(isCommandPaletteOpen.value).toBe(true)
    press('K', { metaKey: true, shiftKey: true })
    expect(isCommandPaletteOpen.value).toBe(true)
    press('k', { metaKey: true })
    expect(isCommandPaletteOpen.value).toBe(false)

    input.remove()
    wrapper.unmount()
  })

  it('does not open it with a plain k', async () => {
    const { wrapper } = await setup()

    press('k')
    expect(isCommandPaletteOpen.value).toBe(false)

    wrapper.unmount()
  })

  it('a opens and closes the agents panel, not while typing', async () => {
    isAssistOpen.value = false
    const { wrapper } = await setup()
    press('a')
    expect(isAssistOpen.value).toBe(true)
    press('a')
    expect(isAssistOpen.value).toBe(false)

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }))
    expect(isAssistOpen.value).toBe(false)
    input.remove()
    wrapper.unmount()
  })
})
