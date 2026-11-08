import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSettingsStore } from '@/shared/stores'
import { SearchBar } from '@/shared/ui/search-bar'
import KeyHintBar from './key-hint-bar.vue'

describe('KeyHintBar', () => {
  beforeEach(() => {
    const items = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => void items.set(key, String(value)),
      removeItem: (key: string) => void items.delete(key),
      clear: () => items.clear(),
    })
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is hidden until «Show key hints» is on', () => {
    expect(mount(KeyHintBar, { props: { bar: 'event-list' } }).find('.key-hint-bar').exists()).toBe(false)
  })

  it('shows the list keys when key hints are on', () => {
    useSettingsStore().changeKeyHints()
    const search = mount(SearchBar)
    const wrapper = mount(KeyHintBar, { props: { bar: 'event-list' } })

    expect(wrapper.text()).toContain('jkevents')
    expect(wrapper.text()).toContain('/find')
    expect(wrapper.text()).toContain('?all keys')
    search.unmount()
  })

  // Sentry exceptions in Timeline mode: a list without a search box, where / does nothing.
  it('leaves out «/ find» while no search box is on the page', async () => {
    useSettingsStore().changeKeyHints()
    const search = mount(SearchBar)
    const wrapper = mount(KeyHintBar, { props: { bar: 'event-list' } })

    search.unmount()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).not.toContain('/find')
    expect(wrapper.text()).toContain('jkevents')
  })

  it('hides while single-key shortcuts are off: its keys would do nothing', () => {
    useSettingsStore().changeKeyHints()
    useSettingsStore().changeSingleKeyShortcuts()

    expect(mount(KeyHintBar, { props: { bar: 'event-list' } }).find('.key-hint-bar').exists()).toBe(false)
  })
})
