import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useSettingsStore } from '@/shared/stores'
import SettingsMenuItems from './settings-menu-items.vue'

const xdebug = ref(false)
vi.mock('@/entities/xdebug/lib', () => ({ useXdebugEnabled: () => xdebug }))
const codeGraph = ref(false)
vi.mock('@/entities/code-graph/lib', () => ({ useCodeGraphEnabled: () => codeGraph }))

const memoryStorage = () => {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, String(value)),
    removeItem: (key: string) => void items.delete(key),
    clear: () => items.clear(),
  }
}

const switchOf = (wrapper: ReturnType<typeof mount>, id: string) =>
  wrapper.get(`[data-menu-item="${id}"] [role="switch"]`)

describe('SettingsMenuItems', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
    useSettingsStore().availableEvents = ['sentry', 'ray', 'http-dump', 'smtp']
    xdebug.value = false
    codeGraph.value = false
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lists the entries this server has, by menu group, each named by its label', () => {
    const wrapper = mount(SettingsMenuItems)
    const items = wrapper.findAll('[data-menu-item]').map((el) => el.attributes('data-menu-item'))

    expect(items).toEqual(['sentry', 'ray', 'http-dump', 'smtp', 'mock-server'])
    expect(wrapper.findAll('.s-menu__group-title').map((el) => el.text())).toEqual([
      'Errors & performance', 'Dumps', 'Mail & logs', 'Tools',
    ])
    const toggle = switchOf(wrapper, 'ray')
    expect(wrapper.get(`#${toggle.attributes('aria-labelledby')}`).text()).toBe('Ray')
  })

  it('shows Xdebug only when the server has it', () => {
    xdebug.value = true
    expect(mount(SettingsMenuItems).find('[data-menu-item="xdebug"]').exists()).toBe(true)
  })

  it('shows Code only when the server has code graph roots', () => {
    expect(mount(SettingsMenuItems).find('[data-menu-item="code"]').exists()).toBe(false)
    codeGraph.value = true
    expect(mount(SettingsMenuItems).find('[data-menu-item="code"]').exists()).toBe(true)
  })

  // The server serves mocks from the http-dump module (#6019).
  it('has no Mock server entry when the server has http-dump off', () => {
    useSettingsStore().availableEvents = ['sentry', 'ray', 'smtp']
    expect(mount(SettingsMenuItems).find('[data-menu-item="mock-server"]').exists()).toBe(false)
  })

  it('turns an entry off and remembers it per browser', async () => {
    const wrapper = mount(SettingsMenuItems)

    await switchOf(wrapper, 'ray').trigger('click')

    expect(switchOf(wrapper, 'ray').attributes('aria-checked')).toBe('false')
    expect(useSettingsStore().hiddenMenuItems).toEqual(['ray'])
    expect(JSON.parse(localStorage.getItem('hidden_menu_items') ?? '')).toEqual(['ray'])
  })

  it('keeps the last entry on and says why', async () => {
    useSettingsStore().hiddenMenuItems = ['sentry', 'ray', 'http-dump', 'smtp']
    const wrapper = mount(SettingsMenuItems)
    const last = switchOf(wrapper, 'mock-server')

    expect(last.attributes('aria-disabled')).toBe('true')
    await last.trigger('click')
    expect(last.attributes('aria-checked')).toBe('true')
    expect(wrapper.get(`#${last.attributes('aria-describedby')}`).text()).toBe('One item always stays on.')
    // Right under the locked row.
    expect(wrapper.get('[data-menu-item="mock-server"]').element.nextElementSibling?.textContent?.trim()).toBe(
      'One item always stays on.',
    )
  })

  it('«Show all» turns every entry back on; nothing to show disables it', async () => {
    useSettingsStore().hiddenMenuItems = ['sentry', 'smtp']
    const wrapper = mount(SettingsMenuItems)
    const showAll = wrapper.get('[data-test="menu-show-all"]')

    expect(showAll.attributes('disabled')).toBeUndefined()
    await showAll.trigger('click')

    expect(useSettingsStore().hiddenMenuItems).toEqual([])
    expect(wrapper.findAll('[role="switch"]').every((s) => s.attributes('aria-checked') === 'true')).toBe(true)
    expect(showAll.attributes('disabled')).toBeDefined()
  })

  it('reads what was saved before', () => {
    localStorage.setItem('hidden_menu_items', '["smtp"]')
    setActivePinia(createPinia())
    useSettingsStore().availableEvents = ['sentry', 'ray', 'http-dump', 'smtp']

    expect(switchOf(mount(SettingsMenuItems), 'smtp').attributes('aria-checked')).toBe('false')
  })
})
