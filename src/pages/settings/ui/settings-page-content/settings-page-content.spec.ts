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
