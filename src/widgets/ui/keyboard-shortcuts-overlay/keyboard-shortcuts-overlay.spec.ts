import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import KeyboardShortcutsOverlay from './keyboard-shortcuts-overlay.vue'

// Audit 5.9: the overlay was not a dialog, focus stayed behind it, «×» had no name.
describe('KeyboardShortcutsOverlay', () => {
  afterEach(() => { document.body.innerHTML = '' })

  it('is a named modal dialog that takes focus and closes on Escape', async () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()

    const wrapper = mount(KeyboardShortcutsOverlay, { attachTo: document.body })
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    const title = document.getElementById(dialog.getAttribute('aria-labelledby')!)
    expect(title?.textContent?.trim()).toBe('Keyboard Shortcuts')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Close')

    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(wrapper.emitted('close')).toHaveLength(1)

    wrapper.unmount()
    expect(document.activeElement).toBe(opener)
  })
})
