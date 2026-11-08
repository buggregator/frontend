import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSettingsStore } from '@/shared/stores'
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
    const wrapper = mount(KeyHintBar, { props: { bar: 'event-list' } })

    expect(wrapper.text()).toContain('jkevents')
    expect(wrapper.text()).toContain('?all keys')
  })

  it('hides while single-key shortcuts are off: its keys would do nothing', () => {
    useSettingsStore().changeKeyHints()
    useSettingsStore().changeSingleKeyShortcuts()

    expect(mount(KeyHintBar, { props: { bar: 'event-list' } }).find('.key-hint-bar').exists()).toBe(false)
  })
})
