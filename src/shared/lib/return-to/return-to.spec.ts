import { describe, expect, it } from 'vitest'
import { safeReturnTo, withReturnTo } from './return-to'

// #6772: the page to open after sign-in. Same rule as the server
// (internal/auth safeReturnTo): only a path of this site.
describe('safeReturnTo', () => {
  it.each([
    ['/events/sentry/1', '/events/sentry/1'],
    ['/sentry?period=24h#x', '/sentry?period=24h#x'],
  ])('keeps a path of this site: %s', (value, expected) => {
    expect(safeReturnTo(value)).toBe(expected)
  })

  it.each([undefined, null, '', '/', '//evil.test', '/\\evil.test', 'https://evil.test/', 'events', '/login', '/login?token=x', ['/a']])(
    'drops anything else: %s',
    (value) => {
      expect(safeReturnTo(value)).toBeUndefined()
    }
  )
})

describe('withReturnTo', () => {
  it('adds the page to the sign-in address', () => {
    expect(withReturnTo('http://h/auth/sso/login', '/events/sentry/1')).toBe(
      'http://h/auth/sso/login?return_to=%2Fevents%2Fsentry%2F1'
    )
  })

  it('joins with & when the address has a query', () => {
    expect(withReturnTo('http://h/login?x=1', '/a')).toBe('http://h/login?x=1&return_to=%2Fa')
  })

  it('leaves the address as is without a safe page', () => {
    expect(withReturnTo('http://h/auth/sso/login', '//evil')).toBe('http://h/auth/sso/login')
  })
})
