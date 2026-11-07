import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSettingsStore } from '@/shared/stores'
import SettingsPageContent from './settings-page-content.vue'

const memoryStorage = () => {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, String(value)),
    removeItem: (key: string) => void items.delete(key),
    clear: () => items.clear(),
  }
}

describe('SettingsPageContent: single-key shortcuts', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('says that the switch also covers the arrow keys', () => {
    const wrapper = mount(SettingsPageContent)

    expect(wrapper.text()).toContain('Turning this off frees ↑/↓ for scrolling too.')
  })

  it('turns single-key shortcuts off and remembers it', async () => {
    const wrapper = mount(SettingsPageContent)
    const toggle = wrapper.get('[role="switch"][aria-label="Single-key shortcuts"]')

    expect(toggle.attributes('aria-checked')).toBe('true')

    await toggle.trigger('click')

    expect(toggle.attributes('aria-checked')).toBe('false')
    expect(useSettingsStore().isSingleKeyShortcutsEnabled).toBe(false)
    expect(localStorage.getItem('single_key_shortcuts')).toBe('false')
  })
})

describe('SettingsPageContent: new server release', () => {
  const release = {
    current: '2.7.0',
    latest: '2.8.0',
    url: 'https://github.com/buggregator/server/releases/tag/v2.8.0',
    available: true,
  }

  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('tells about a newer release and links its notes in a new tab', () => {
    useSettingsStore().update = release
    const wrapper = mount(SettingsPageContent)

    expect(wrapper.get('[data-test="update-available"]').text()).toContain('Buggregator 2.8.0 is available (you run 2.7.0)')
    const link = wrapper.get('[data-test="update-available"] a')
    expect(link.attributes('href')).toBe(release.url)
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toContain('noopener')
    expect(wrapper.find('[data-test="update-current"]').exists()).toBe(false)
  })

  it('says up to date when the check found nothing newer', () => {
    useSettingsStore().update = { ...release, latest: '2.7.0', available: false }
    const wrapper = mount(SettingsPageContent)

    expect(wrapper.get('[data-test="update-current"]').text()).toBe('Up to date')
    expect(wrapper.find('[data-test="update-available"]').exists()).toBe(false)
  })

  it('shows nothing new without a check result', () => {
    const wrapper = mount(SettingsPageContent)

    expect(wrapper.find('[data-test="update-available"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="update-current"]').exists()).toBe(false)
  })
})
