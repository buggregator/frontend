import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IDE_KEYS } from '../../constants'
import { EventTypes } from '../../types'
import { useSettingsStore } from './settings-store'

// Audit 1.9: a server that did not answer threw inside the router guard and
// left a blank page.
describe('settingsStore.fetchSettings', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not throw when the server cannot be reached, and says why', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    const store = useSettingsStore()

    await expect(store.fetchSettings()).resolves.toBeNull()
    expect(store.fetchError).toBe('The server cannot be reached.')
    expect(store.isFetched).toBe(false)
    expect(store.availableEvents).toEqual(Object.values(EventTypes))
  })

  it('reports an error answer', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('oops', { status: 502 }))))
    const store = useSettingsStore()

    await store.fetchSettings()

    expect(store.fetchError).toBe('The server answered 502.')
  })

  it('takes auth and version from a good answer', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(
      '{"version":"2.0.0","auth":{"enabled":true,"login_url":"/auth/sso/login"}}',
    ))))
    const store = useSettingsStore()

    await store.fetchSettings()

    expect(store.fetchError).toBe('')
    expect(store.isFetched).toBe(true)
    expect(store.apiVersion).toBe('2.0.0')
    expect(store.isAuthEnabled).toBe(true)
    expect(store.update).toBeNull()
  })

  it('keeps the newer release the server found', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      version: '2.7.0',
      update: {
        current: '2.7.0',
        latest: '2.8.0',
        url: 'https://github.com/buggregator/server/releases/tag/v2.8.0',
        available: true,
        checked_at: '2026-11-07T14:40:39Z',
      },
    })))))
    const store = useSettingsStore()

    await store.fetchSettings()

    expect(store.update).toEqual({
      current: '2.7.0',
      latest: '2.8.0',
      url: 'https://github.com/buggregator/server/releases/tag/v2.8.0',
      available: true,
    })
  })

  // The server sends the enabled modules as top-level `events` (#6012 review);
  // `client.events` is the older shape; neither: every type.
  it.each([
    ['top-level events', { events: ['sentry', 'smtp'] }, ['sentry', 'smtp']],
    ['the older client.events', { client: { events: ['ray'] } }, ['ray']],
    ['top-level over client', { events: ['smtp'], client: { events: ['ray'] } }, ['smtp']],
  ])('takes the enabled modules from %s', async (_, body, expected) => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({ version: '2.11.0', ...body })))))
    const store = useSettingsStore()

    await store.fetchSettings()

    expect(store.availableEvents).toEqual(expected)
  })

  it('takes every type when the server names none', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{"version":"1.0.0"}'))))
    const store = useSettingsStore()

    await store.fetchSettings()

    expect(store.availableEvents).toContain('var-dump')
    expect(store.availableEvents).toContain('sentry')
  })
})

// GitHub server#255: an IDE link sent by the SDK is used only while the person
// has not picked an editor in Settings themselves.
describe('settingsStore.isCodeEditorChosen', () => {
  const memoryStorage = (initial: Record<string, string> = {}) => {
    const items = new Map(Object.entries(initial))
    return {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => void items.set(key, String(value)),
      removeItem: (key: string) => void items.delete(key),
      clear: () => items.clear(),
    }
  }

  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is off while the editor is the default', () => {
    vi.stubGlobal('localStorage', memoryStorage())
    setActivePinia(createPinia())

    expect(useSettingsStore().isCodeEditorChosen).toBe(false)
  })

  it('is on once an editor is picked, and after a reload', () => {
    vi.stubGlobal('localStorage', memoryStorage())
    setActivePinia(createPinia())
    useSettingsStore().changeActiveCodeEditor(IDE_KEYS.PHPSTORM)

    expect(useSettingsStore().isCodeEditorChosen).toBe(true)

    setActivePinia(createPinia())
    expect(useSettingsStore().isCodeEditorChosen).toBe(true)
  })
})

describe('settingsStore.isKeyHintsEnabled', () => {
  const memoryStorage = () => {
    const items = new Map<string, string>()
    return {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => void items.set(key, String(value)),
      removeItem: (key: string) => void items.delete(key),
      clear: () => items.clear(),
    }
  }

  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    vi.stubGlobal('localStorage', memoryStorage())
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is off by default', () => {
    expect(useSettingsStore().isKeyHintsEnabled).toBe(false)
  })

  it('is remembered after a reload once turned on', () => {
    useSettingsStore().changeKeyHints()

    expect(useSettingsStore().isKeyHintsEnabled).toBe(true)

    setActivePinia(createPinia())
    expect(useSettingsStore().isKeyHintsEnabled).toBe(true)
  })
})

// Settings › Theme: «System» could not be picked; it was neither marked nor
// remembered (#5874).
describe('settingsStore.themeMode', () => {
  let systemDark = false
  let onSystemChange: (() => void) | null = null
  const items = new Map<string, string>()

  beforeEach(() => {
    systemDark = false
    onSystemChange = null
    items.clear()
    vi.stubGlobal('matchMedia', () => ({
      get matches() { return systemDark },
      addEventListener: (_: string, cb: () => void) => { onSystemChange = cb },
    }))
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => void items.set(key, String(value)),
    })
    document.documentElement.classList.remove('dark')
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is System when nothing was picked, and follows the system', () => {
    systemDark = true
    const store = useSettingsStore()

    expect(store.themeMode).toBe('system')
    expect(store.themeType).toBe('dark')
  })

  it('remembers System after a reload', () => {
    useSettingsStore().setThemeMode('light')
    useSettingsStore().setThemeMode('system')

    setActivePinia(createPinia())
    expect(useSettingsStore().themeMode).toBe('system')
    expect(items.get('theme')).toBe('system')
  })

  it('switches the page when the system theme changes, in System only', () => {
    const store = useSettingsStore()
    store.setThemeMode('system')
    store.watchSystemTheme()

    systemDark = true
    onSystemChange?.()
    expect(store.themeType).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    store.setThemeMode('light')
    systemDark = false
    onSystemChange?.()
    systemDark = true
    onSystemChange?.()
    expect(store.themeType).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('keeps an explicit pick over the system', () => {
    systemDark = true
    useSettingsStore().setThemeMode('light')

    setActivePinia(createPinia())
    expect(useSettingsStore().themeMode).toBe('light')
    expect(useSettingsStore().themeType).toBe('light')
  })
})
