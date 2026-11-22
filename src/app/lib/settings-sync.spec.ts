import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventsStore, useProfileStore, useSettingsStore } from '@/shared/stores'
import { LocalStorageKeys } from '@/shared/types'
import { forgetSyncedSettings, pullSyncedSettings, pushSyncedSettings, SYNCED_KEYS } from './settings-sync'

const answer = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body)))

// #6772: on sign-in the person's saved preferences show at once.
describe('settings sync in the app', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }))
    setActivePinia(createPinia())
    forgetSyncedSettings()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('syncs preferences but never the token or what was seen', () => {
    expect(SYNCED_KEYS).toContain(LocalStorageKeys.Theme)
    expect(SYNCED_KEYS).toContain(LocalStorageKeys.Period)
    expect(SYNCED_KEYS).toContain(LocalStorageKeys.DesktopNotifications)
    expect(SYNCED_KEYS).toContain('sentry_exceptions_level')
    expect(SYNCED_KEYS).not.toContain(LocalStorageKeys.Token)
    expect(SYNCED_KEYS).not.toContain(LocalStorageKeys.SeenEvents)
  })

  it('applies the saved theme, period and switches on sign-in', async () => {
    const fetchMock = vi.fn(() =>
      answer({ data: { [LocalStorageKeys.Theme]: 'dark', [LocalStorageKeys.Period]: '24h', [LocalStorageKeys.KeyHints]: 'true' } })
    )
    vi.stubGlobal('fetch', fetchMock)
    useProfileStore().setToken('tok')

    await pullSyncedSettings('tok')

    expect(useSettingsStore().themeType).toBe('dark')
    expect(useSettingsStore().isKeyHintsEnabled).toBe(true)
    expect(useEventsStore().period).toBe('24h')
  })

  it('reads once per sign-in, then sends what changed', async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => answer({ data: init?.method === 'PUT' ? {} : {} }))
    vi.stubGlobal('fetch', fetchMock)
    useProfileStore().setToken('tok')

    await pullSyncedSettings('tok')
    await pullSyncedSettings('tok')
    useSettingsStore().changeKeyHints()
    await pushSyncedSettings()

    const methods = fetchMock.mock.calls.map(([, init]) => init?.method ?? 'GET')
    expect(methods).toEqual(['GET', 'PUT'])
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toMatchObject({ [LocalStorageKeys.KeyHints]: 'true' })
  })

  it('keeps working from this browser when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(pullSyncedSettings('tok')).resolves.toBeUndefined()
    await expect(pushSyncedSettings()).resolves.toBeUndefined()
  })
})
