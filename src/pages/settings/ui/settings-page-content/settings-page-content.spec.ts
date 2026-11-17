import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useServerUpdateStore } from '@/entities/server-update'
import { availableStatus, checkOffStatus } from '@/entities/server-update/mocks'
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
    const toggle = wrapper.get('[data-setting="single-key-shortcuts"] [role="switch"]')
    // Named by its row label.
    expect(wrapper.get(`#${toggle.attributes('aria-labelledby')}`).text()).toBe('Single-key shortcuts')

    expect(toggle.attributes('aria-checked')).toBe('true')

    await toggle.trigger('click')

    expect(toggle.attributes('aria-checked')).toBe('false')
    expect(useSettingsStore().isSingleKeyShortcutsEnabled).toBe(false)
    expect(localStorage.getItem('single_key_shortcuts')).toBe('false')
  })

  it('turns key hints on and remembers it', async () => {
    const wrapper = mount(SettingsPageContent)
    const toggle = wrapper.get('[data-setting="key-hints"] [role="switch"]')

    expect(toggle.attributes('aria-checked')).toBe('false')

    await toggle.trigger('click')

    expect(toggle.attributes('aria-checked')).toBe('true')
    expect(localStorage.getItem('key_hints')).toBe('true')
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

describe('SettingsPageContent: About & updates', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the update block when the server has /api/update', () => {
    useServerUpdateStore().setStatus(availableStatus)
    const wrapper = mount(SettingsPageContent)

    expect(wrapper.get('#updates h2').text()).toBe('About & updates')
    expect(wrapper.find('[data-test="update-panel"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="update-available"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Client')
  })

  it('passes Check now and Update to the store', async () => {
    const store = useServerUpdateStore()
    store.setStatus(availableStatus)
    const check = vi.spyOn(store, 'check').mockResolvedValue()
    const start = vi.spyOn(store, 'start').mockResolvedValue()
    const wrapper = mount(SettingsPageContent)

    await wrapper.get('[data-test="update-check"]').trigger('click')
    await wrapper.get('[data-test="update-start"]').trigger('click')

    expect(check).toHaveBeenCalled()
    expect(start).toHaveBeenCalledWith('2.10.0')
  })

  // With the update check off the server sends no version: /api/settings has it.
  it('shows the version from settings when /api/update has none', () => {
    useSettingsStore().apiVersion = '2.9.0'
    useServerUpdateStore().setStatus(checkOffStatus)
    const wrapper = mount(SettingsPageContent)

    expect(wrapper.get('[data-test="update-version"]').text()).toBe('v2.9.0')
    expect(wrapper.find('[data-test="update-check"]').exists()).toBe(false)
  })

  // An older server answers 404: the About block stays as it was.
  it('keeps the old About block without /api/update', () => {
    useServerUpdateStore().supported = false
    useSettingsStore().update = { current: '2.7.0', latest: '2.8.0', url: 'https://github.com/x', available: true }
    const wrapper = mount(SettingsPageContent)

    expect(wrapper.find('[data-test="update-panel"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="update-available"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('About')
  })
})

describe('SettingsPageContent: theme, search, sections (#5874)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const themeButton = (wrapper: ReturnType<typeof mount>, label: string) =>
    wrapper.findAll('[data-setting="theme"] button').find((b) => b.text() === label)!

  it('marks System and remembers it', async () => {
    const wrapper = mount(SettingsPageContent)

    expect(themeButton(wrapper, 'System').attributes('aria-pressed')).toBe('true')

    await themeButton(wrapper, 'Dark').trigger('click')
    expect(themeButton(wrapper, 'Dark').attributes('aria-pressed')).toBe('true')
    expect(themeButton(wrapper, 'System').attributes('aria-pressed')).toBe('false')

    await themeButton(wrapper, 'System').trigger('click')
    expect(themeButton(wrapper, 'System').attributes('aria-pressed')).toBe('true')
    expect(localStorage.getItem('theme')).toBe('system')
  })

  it('lists the sections, About & updates included', () => {
    useServerUpdateStore().setStatus(availableStatus)
    const wrapper = mount(SettingsPageContent)

    const links = wrapper.findAll('nav[aria-label="Settings sections"] a')
    expect(links.map((a) => a.text())).toEqual(['Appearance', 'Keyboard', 'Editor', 'About & updates'])
    expect(links.map((a) => a.attributes('href'))).toEqual(['#appearance', '#keyboard', '#editor', '#updates'])
    expect(links[0].attributes('aria-current')).toBe('true')
  })

  it('fades the settings that do not match and marks the match', async () => {
    const wrapper = mount(SettingsPageContent)

    await wrapper.get('input[aria-label="Search settings"]').setValue('sho')

    expect(wrapper.get('[data-setting="single-key-shortcuts"]').classes()).not.toContain('settings-row--dim')
    expect(wrapper.get('[data-setting="single-key-shortcuts"] mark').text()).toBe('sho')
    expect(wrapper.get('[data-setting="pin-header"]').classes()).toContain('settings-row--dim')
    expect(wrapper.get('[role="status"]').text()).toBe('3 settings match.')
  })

  it('says when nothing matches', async () => {
    const wrapper = mount(SettingsPageContent)

    await wrapper.get('input[aria-label="Search settings"]').setValue('zzz')

    expect(wrapper.text()).toContain('No settings match «zzz».')
    expect(wrapper.findAll('.settings-row--dim').length).toBe(7)
  })

  it('keeps the hint to one line and shows the rest behind More', async () => {
    const wrapper = mount(SettingsPageContent)
    const row = wrapper.get('[data-setting="key-hints"]')
    const more = row.get('button[aria-expanded]')
    const text = row.get(`#${more.attributes('aria-controls')}`)

    expect(more.attributes('aria-expanded')).toBe('false')
    expect(text.attributes('style')).toContain('display: none')

    await more.trigger('click')

    expect(more.attributes('aria-expanded')).toBe('true')
    expect(text.attributes('style') ?? '').not.toContain('display: none')
  })

  it('opens the long text when only it matches the search', async () => {
    const wrapper = mount(SettingsPageContent)

    await wrapper.get('input[aria-label="Search settings"]').setValue('screen reader')

    expect(wrapper.get('[data-setting="single-key-shortcuts"] button[aria-expanded]').attributes('aria-expanded')).toBe('true')
  })
})
