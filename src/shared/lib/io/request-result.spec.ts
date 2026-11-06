import { describe, expect, it } from 'vitest'
import { describeLoadError, isRequestOk } from './request-result'

// A write goes either over the WebSocket RPC bridge or over REST. The bridge
// wraps the HTTP answer as { data: { code, data } } and resolves even for a
// 404 or 500, so a truthy answer is not a success.
describe('isRequestOk', () => {
  it('accepts an RPC answer with a 2xx code', () => {
    expect(isRequestOk({ data: { code: 200, data: { status: true } } })).toBe(true)
  })

  it('rejects an RPC answer with an error code', () => {
    expect(isRequestOk({ data: { code: 500, data: { error: 'disk full' } } })).toBe(false)
    expect(isRequestOk({ data: { code: 404, data: null } })).toBe(false)
  })

  it('rejects an RPC answer without a code', () => {
    expect(isRequestOk({ data: { status: true } })).toBe(false)
  })

  it('follows response.ok for REST', () => {
    expect(isRequestOk(new Response('{}', { status: 200 }))).toBe(true)
    expect(isRequestOk(new Response('{}', { status: 500 }))).toBe(false)
  })

  it('rejects nothing at all (a network error caught on the way)', () => {
    expect(isRequestOk(undefined)).toBe(false)
    expect(isRequestOk(null)).toBe(false)
  })
})

describe('describeLoadError', () => {
  it('names the status of an error answer', () => {
    expect(describeLoadError({ status: 500 })).toBe('The server answered 500.')
  })

  it('asks to sign in on 401 and 403', () => {
    expect(describeLoadError({ status: 403 })).toBe('Access denied. Sign in again.')
  })

  it('says the server cannot be reached on a network error', () => {
    expect(describeLoadError(new TypeError('Failed to fetch'))).toBe('The server cannot be reached.')
  })
})
