import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProfileStore } from './profile-store'

// Audit 1.9: a refused token put an Error object into the profile.
describe('profileStore.getProfile', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('drops a refused token and keeps no profile', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{}', { status: 403 }))))
    const store = useProfileStore()
    store.setToken('bad')

    expect(await store.getProfile()).toBeUndefined()
    expect(store.profile).toBeUndefined()
    expect(store.token).toBe('')
  })

  it('keeps no profile when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    const store = useProfileStore()

    expect(await store.getProfile()).toBeUndefined()
    expect(store.profile).toBeUndefined()
  })

  it('stores the profile of a good answer', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{"username":"ann"}'))))

    expect(await useProfileStore().getProfile()).toEqual({ username: 'ann' })
  })

  // The Go server wraps the profile: {"data":{...}} (internal/auth/handlers.go handleMe).
  it('unwraps the profile from the data envelope of the Go server', async () => {
    const body = '{"data":{"username":"ann","email":"ann@example.com","avatar":"","logout_url":""}}'
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(body))))
    const store = useProfileStore()

    await store.getProfile()

    expect(store.profile?.username).toBe('ann')
    expect(store.profile?.email).toBe('ann@example.com')
  })

  it('keeps no profile when the answer is not a profile object', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{"data":null}'))))

    expect(await useProfileStore().getProfile()).toBeUndefined()
  })
})
