import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SHORTCUTS, capsOf } from '@/shared/lib/shortcuts'
import { useSettingsStore } from '@/shared/stores'
import KeyboardShortcutsOverlay from './keyboard-shortcuts-overlay.vue'

// Audit 5.9: the overlay was not a dialog, focus stayed behind it, «×» had no name.
describe('KeyboardShortcutsOverlay', () => {
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
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
  })

  it('is a named modal dialog that takes focus and closes on Escape', async () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()

    const wrapper = mount(KeyboardShortcutsOverlay, { attachTo: document.body })
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    const title = document.getElementById(dialog.getAttribute('aria-labelledby')!)
    expect(title?.textContent?.trim()).toBe('Keyboard shortcuts')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Close')

    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(wrapper.emitted('close')).toHaveLength(1)

    wrapper.unmount()
    expect(document.activeElement).toBe(opener)
  })

  it('lists every shortcut of the registry with its keys', () => {
    const wrapper = mount(KeyboardShortcutsOverlay, { attachTo: document.body })
    const rows = [...document.querySelectorAll('.shortcuts-row')].map((row) => ({
      keys: [...row.querySelectorAll('kbd')].map((k) => k.textContent?.trim()),
      label: row.querySelector('.shortcuts-row__desc')?.textContent?.trim(),
    }))

    for (const s of SHORTCUTS) {
      expect(rows).toContainEqual({ keys: capsOf(s), label: s.label })
    }
    expect(rows).toHaveLength(SHORTCUTS.length)
    wrapper.unmount()
  })

  it('says shortcuts work outside text fields', () => {
    const wrapper = mount(KeyboardShortcutsOverlay, { attachTo: document.body })
    expect(document.body.textContent).toContain('Shortcuts work when the cursor is not in a text field')
    wrapper.unmount()
  })

  it.each([
    ['Single-key shortcuts', 'isSingleKeyShortcutsEnabled', true],
    ['Show key hints', 'isKeyHintsEnabled', false],
  ] as const)('the «%s» switch in the footer flips the setting', async (name, flag, initial) => {
    const wrapper = mount(KeyboardShortcutsOverlay, { attachTo: document.body })
    const store = useSettingsStore()
    const toggle = document.querySelector(`[role="switch"][aria-label="${name}"]`) as HTMLElement

    expect(store[flag]).toBe(initial)
    expect(toggle.getAttribute('aria-checked')).toBe(String(initial))

    toggle.click()
    await wrapper.vm.$nextTick()

    expect(store[flag]).toBe(!initial)
    expect(toggle.getAttribute('aria-checked')).toBe(String(!initial))
    wrapper.unmount()
  })
})
