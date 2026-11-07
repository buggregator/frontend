import { describe, expect, it } from 'vitest'
import {
  bodyBytes,
  withQuery,
  draftFromRequest,
  emptyDraft,
  pathParts,
  requestPath,
  validateRule,
} from './mock-rule'

describe('pathParts', () => {
  it('marks {params} and a trailing *', () => {
    expect(pathParts('/users/{id}/files/*')).toEqual([
      { text: '/users/', kind: 'text' },
      { text: '{id}', kind: 'param' },
      { text: '/files/', kind: 'text' },
      { text: '*', kind: 'wildcard' },
    ])
  })

  it('keeps a plain path as one part', () => {
    expect(pathParts('/health')).toEqual([{ text: '/health', kind: 'text' }])
  })
})

describe('requestPath', () => {
  it('drops the /mock prefix and keeps the query', () => {
    expect(requestPath('/mock/users/42?page=2')).toBe('/users/42?page=2')
    expect(requestPath('/mock')).toBe('/')
  })

  // the HTTP dump stores the URI without the leading slash
  it('accepts a URI without the leading slash', () => {
    expect(requestPath('mock/health')).toBe('/health')
    expect(requestPath('mock')).toBe('/')
    expect(requestPath('mockery/x')).toBe('/mockery/x')
  })
})

describe('withQuery', () => {
  it('appends the query kept apart by the dump', () => {
    expect(withQuery('/users/42/posts', { page: '2', tag: ['a', 'b'] })).toBe('/users/42/posts?page=2&tag=a&tag=b')
    expect(withQuery('/x?y=1', { page: '2' })).toBe('/x?y=1')
    expect(withQuery('/x', {})).toBe('/x')
  })
})

describe('validateRule', () => {
  const ok = { ...emptyDraft(), path: '/users/{id}' }

  it('accepts a valid rule', () => {
    expect(validateRule(ok)).toEqual({})
  })

  it.each([
    ['users', 'Path must start with “/”.'],
    ['/users/{id', 'Every “{” needs a closing “}”.'],
    ['/files/*/x', '“*” is allowed only as the last segment.'],
    ['/files/a*', '“*” must be a whole segment.'],
  ])('path %s', (path, message) => {
    expect(validateRule({ ...ok, path }).path).toBe(message)
  })

  it.each([99, 600, Number.NaN])('status %s', (status) => {
    expect(validateRule({ ...ok, status }).status).toBe('Status must be between 100 and 599.')
  })

  it.each([-1, 30001])('delay %s', (delay_ms) => {
    expect(validateRule({ ...ok, delay_ms }).delay_ms).toBe('Delay must be between 0 and 30000 ms.')
  })

  it('body over 1 MB', () => {
    expect(validateRule({ ...ok, body: 'x'.repeat(1024 * 1024 + 1) }).body).toBe('Body must be at most 1 MB.')
  })

  // the server canonicalises names, so which value wins would depend on map order
  it('header names that differ only in case', () => {
    expect(validateRule({ ...ok, headers: { 'content-type': 'a', 'Content-Type': 'b' } }).headers).toBe(
      'Header “Content-Type” is set twice.'
    )
  })

  it('header with an empty name or a space', () => {
    expect(validateRule({ ...ok, headers: { '': 'x' } }).headers).toBe('Header names cannot be empty or contain spaces or “:”.')
    expect(validateRule({ ...ok, headers: { 'X Y': 'x' } }).headers).toBeDefined()
  })
})

describe('bodyBytes', () => {
  it('counts UTF-8 bytes', () => {
    expect(bodyBytes('é')).toBe(2)
  })
})

describe('draftFromRequest', () => {
  it('turns numeric and UUID segments into {id} and drops the query', () => {
    const d = draftFromRequest('GET', '/mock/users/42/orders/3fa85f64-5717-4562-b3fc-2c963f66afa6/items?x=1', 'shop')
    expect(d).toMatchObject({
      method: 'GET',
      path: '/users/{id}/orders/{id}/items',
      project: 'shop',
      status: 200,
      enabled: true,
    })
  })

  it('works with a stored URI without the leading slash', () => {
    expect(draftFromRequest('DELETE', 'mock/users/7', 'default').path).toBe('/users/{id}')
  })

  it('keeps a plain path', () => {
    expect(draftFromRequest('POST', '/mock/payments/charge', 'default').path).toBe('/payments/charge')
  })
})

describe('response templates', () => {
  it('a new rule is a plain body: template off, random seed', () => {
    expect(emptyDraft()).toMatchObject({ template: false, seed: 0 })
  })

  it('a rule from a captured request is plain too', () => {
    expect(draftFromRequest('GET', '/mock/users/42', '')).toMatchObject({ template: false, seed: 0 })
  })

  it('asks for a whole number seed', () => {
    const tpl = { ...emptyDraft(), path: '/a', template: true }
    expect(validateRule({ ...tpl, seed: 1.5 }).seed).toBe('Seed must be a whole number.')
    expect(validateRule({ ...tpl, seed: Number.NaN }).seed).toBe('Seed must be a whole number.')
    expect(validateRule({ ...tpl, seed: -7 }).seed).toBeUndefined()
  })

  // The seed field is hidden with the template off: its error could not be shown.
  it('does not check the seed of a plain body', () => {
    expect(validateRule({ ...emptyDraft(), path: '/a', seed: Number.NaN })).toEqual({})
  })
})
