import { describe, expect, it } from 'vitest'
import { RouteName } from '@/shared/types'
import { loginRoute } from './middlewares'

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
