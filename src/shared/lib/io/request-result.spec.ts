import { describe, expect, it } from 'vitest'
import { isRequestOk } from './request-result'

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
