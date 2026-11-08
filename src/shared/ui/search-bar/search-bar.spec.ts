import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSettingsStore } from '../../stores'
import { SearchBar } from './index'

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

describe('SearchBar keys', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  const mountBar = (modelValue = '') => mount(SearchBar, { props: { modelValue }, attachTo: document.body })

  it('focuses the box with /', () => {
    const wrapper = mountBar()

    press('/')

    expect(document.activeElement).toBe(wrapper.find('input').element)
    wrapper.unmount()
  })

  it('leaves / alone with Ctrl or when single-key shortcuts are off', () => {
    const wrapper = mountBar()

    press('/', { ctrlKey: true })
    expect(document.activeElement).not.toBe(wrapper.find('input').element)

    useSettingsStore().changeSingleKeyShortcuts()
    press('/')
    expect(document.activeElement).not.toBe(wrapper.find('input').element)
    wrapper.unmount()
  })

  it('clears and leaves the box with Esc', async () => {
    const wrapper = mountBar('error')
    const input = wrapper.find('input')
    input.element.focus()

    await input.trigger('keydown', { key: 'Escape' })

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
    expect(document.activeElement).not.toBe(input.element)
    wrapper.unmount()
  })
})
