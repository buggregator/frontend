import { describe, expect, it } from 'vitest'
import { formatAttrValue, otelException, servicesChain, splitOtelAttributes } from './otel'

describe('splitOtelAttributes', () => {
  it('takes the otel.* extras out of the attributes', () => {
    const parts = splitOtelAttributes({
      'http.request.method': 'POST',
      'otel.status_code': 'ERROR',
      'otel.kind': 'client',
      'otel.resource': { 'service.name': 'checkout-api' },
      'otel.scope': { name: 'net/http', version: '0.1' },
      'otel.events': [{ name: 'exception', time: '2026-11-20T10:00:00Z', attributes: { 'exception.type': 'E' } }],
      'otel.links': [{ trace_id: 't', span_id: 's', attributes: {} }]
    })

    expect(parts.attributes).toEqual({ 'http.request.method': 'POST', 'otel.status_code': 'ERROR' })
    expect(parts.kind).toBe('client')
    expect(parts.resource).toEqual({ 'service.name': 'checkout-api' })
    expect(parts.scope).toEqual({ name: 'net/http', version: '0.1' })
    expect(parts.events).toHaveLength(1)
    expect(parts.links[0].span_id).toBe('s')
  })

  it('a Sentry span (no extras, or null): empty parts, attributes as they are', () => {
    expect(splitOtelAttributes(null)).toEqual({ attributes: {}, resource: {}, scope: null, events: [], links: [], kind: null })
    expect(splitOtelAttributes({ 'db.system': 'mysql' }).attributes).toEqual({ 'db.system': 'mysql' })
  })

  it('skips malformed events and links', () => {
    const parts = splitOtelAttributes({ 'otel.events': [null, 'x', { name: 'retry' }], 'otel.links': 'nope' })
    expect(parts.events).toEqual([{ name: 'retry', time: null, attributes: {} }])
    expect(parts.links).toEqual([])
  })
})

describe('otelException', () => {
  it('reads the first exception event', () => {
    const ex = otelException([
      { name: 'retry', time: null, attributes: {} },
      {
        name: 'exception',
        time: 't1',
        attributes: { 'exception.type': 'context.deadlineExceededError', 'exception.message': 'context deadline exceeded', 'exception.stacktrace': 'main.go:88' }
      }
    ])
    expect(ex).toEqual({ type: 'context.deadlineExceededError', message: 'context deadline exceeded', stacktrace: 'main.go:88', time: 't1' })
  })

  it('none without an exception event', () => {
    expect(otelException([])).toBeNull()
  })
})

describe('servicesChain', () => {
  it('joins with arrows and keeps both ends of a long chain', () => {
    expect(servicesChain(['a', 'b'])).toBe('a → b')
    expect(servicesChain(['a', 'b', 'c', 'd', 'e'])).toBe('a → b → … → e')
    expect(servicesChain(undefined)).toBe('')
  })
})

describe('formatAttrValue', () => {
  it('shows null as a dash and objects as JSON', () => {
    expect(formatAttrValue(null)).toBe('—')
    expect(formatAttrValue({ a: 1 })).toBe('{"a":1}')
    expect(formatAttrValue(91)).toBe('91')
  })
})
