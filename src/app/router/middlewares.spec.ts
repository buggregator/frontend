import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { useSettingsStore } from '@/shared/stores'
import { RouteName } from '@/shared/types'
import { loginRoute, requireAuthOn } from './middlewares'

// #6772: a shared event link opened while signed out comes back to the event.
describe('loginRoute', () => {
  it('keeps the page asked for as return_to', () => {
    expect(loginRoute({ fullPath: '/sentry/abc?tab=json' })).toEqual({
      name: RouteName.Login,
      query: { return_to: '/sentry/abc?tab=json' },
    })
  })

  it('has no return_to for the home page', () => {
    expect(loginRoute({ fullPath: '/' })).toEqual({ name: RouteName.Login })
  })
})

// Review #1: with auth off nothing is recorded; /audit goes home.
describe('requireAuthOn', () => {
  it('sends the page home with auth off', async () => {
    setActivePinia(createPinia())
    const settings = useSettingsStore()
    settings.isFetched = true
    settings.isAuthEnabled = false
    expect(await requireAuthOn({ to: {} as never, from: {} as never, next: vi.fn() })).toEqual({ name: RouteName.Home })
  })

  it('lets the page open with auth on', async () => {
    setActivePinia(createPinia())
    const settings = useSettingsStore()
    settings.isFetched = true
    settings.isAuthEnabled = true
    expect(await requireAuthOn({ to: {} as never, from: {} as never, next: vi.fn() })).toBeUndefined()
  })
})
