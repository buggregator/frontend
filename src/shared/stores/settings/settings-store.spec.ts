import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
  })
})
