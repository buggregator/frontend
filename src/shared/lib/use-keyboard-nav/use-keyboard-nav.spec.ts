import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { useSettingsStore } from '../../stores'
import { type KeyboardNavCallbacks, useKeyboardNav } from './use-keyboard-nav'

// Node 25+ has a global `localStorage` without a working `getItem`.
const memoryStorage = () => {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, String(value)),
    removeItem: (key: string) => void items.delete(key),
    clear: () => items.clear(),
  }
}

const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = document) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }))

const setup = (options: KeyboardNavCallbacks = {}, ids = ['a', 'b']) => {
  const onDelete = vi.fn()
  const onOpen = vi.fn()
  const onScreenshot = vi.fn()
  const Host = defineComponent({
    setup() {
      useKeyboardNav(ref(ids), { onDelete, onOpen, onScreenshot, ...options })
      return () => h('button', { id: 'btn' }, 'Copy')
    },
  })
  const wrapper = mount(Host, { attachTo: document.body })
  return { wrapper, onDelete, onOpen, onScreenshot }
}

describe('useKeyboardNav', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('deletes the selected event with x', () => {
    const { wrapper, onDelete } = setup()

    press('j')
    press('x')

    expect(onDelete).toHaveBeenCalledWith('a')
    wrapper.unmount()
  })

  // Audit 5.5: Ctrl+X deleted the selected event, Ctrl+S took a screenshot.
  it.each([
    ['ctrlKey'],
    ['metaKey'],
    ['altKey'],
  ])('ignores keys pressed with %s', (modifier) => {
    const { wrapper, onDelete, onScreenshot } = setup()
    press('j')

    press('x', { [modifier]: true })
    press('s', { [modifier]: true })

    expect(onDelete).not.toHaveBeenCalled()
    expect(onScreenshot).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('does nothing when single-key shortcuts are turned off', () => {
    useSettingsStore().changeSingleKeyShortcuts()
    const { wrapper, onDelete, onOpen } = setup()

    press('j')
    press('x')
    press('Enter')

    expect(onDelete).not.toHaveBeenCalled()
    expect(onOpen).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('leaves Enter to a focused button', () => {
    const { wrapper, onOpen } = setup()
    press('j')

    const button = document.getElementById('btn') as HTMLButtonElement
    button.focus()
    press('Enter', {}, button)

    expect(onOpen).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('brings the selected event into view through scrollToId when given', () => {
    const scrollToId = vi.fn()
    const { wrapper } = setup({ scrollToId }, ['a', 'b', 'c'])

    press('j')
    press('j')

    expect(scrollToId).toHaveBeenNthCalledWith(1, 'a')
    expect(scrollToId).toHaveBeenNthCalledWith(2, 'b')
    wrapper.unmount()
  })

  // Audit 5.6: j/k only painted the card; keyboard focus and the screen reader stayed put.
  it('moves keyboard focus to the selected card once it is in view', async () => {
    for (const id of ['a', 'b']) {
      const card = document.createElement('article')
      card.id = id
      card.tabIndex = -1
      document.body.appendChild(card)
    }
    let scrolled = (): void => {}
    const scrollToId = vi.fn(() => new Promise<void>((r) => { scrolled = r }))
    const { wrapper } = setup({ scrollToId })

    press('j')
    expect(document.activeElement?.id).not.toBe('a')
    scrolled()
    await vi.runAllTimersAsync()
    expect(document.activeElement?.id).toBe('a')

    press('j')
    scrolled()
    await vi.runAllTimersAsync()
    expect(document.activeElement?.id).toBe('b')
    wrapper.unmount()
  })

  // x behind the shortcuts dialog deleted the selected event.
  it('ignores its keys while a modal dialog is open', () => {
    const scrollToId = vi.fn()
    const { wrapper, onDelete } = setup({ scrollToId })
    press('j')
    const dialog = document.createElement('div')
    dialog.setAttribute('aria-modal', 'true')
    document.body.appendChild(dialog)

    press('j')
    press('x')
    expect(scrollToId).toHaveBeenCalledTimes(1)
    expect(onDelete).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
