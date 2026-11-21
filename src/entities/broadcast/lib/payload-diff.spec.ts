import { describe, expect, it } from 'vitest'
import { diffPayload, lostValuePaths } from './payload-diff'

describe('diffPayload', () => {
  it('finds nothing in equal payloads', () => {
    const a = { order: { id: 42, items: [1, 2], tags: { x: null } } }
    expect(diffPayload(a, structuredClone(a))).toEqual([])
  })

  it('reports added, removed and changed keys', () => {
    expect(diffPayload({ a: 1, b: 2 }, { a: 1, c: 3 })).toEqual([
      { path: 'b', kind: 'removed', before: 2 },
      { path: 'c', kind: 'added', after: 3 }
    ])
    expect(diffPayload({ a: 1 }, { a: 2 })).toEqual([{ path: 'a', kind: 'changed', before: 1, after: 2 }])
  })

  it('walks nested objects and names the full path', () => {
    const before = { order: { id: 42, status: 'packed', tracking: null } }
    const after = { order: { id: 42, status: null, tracking: '1Z99' } }
    expect(diffPayload(before, after)).toEqual([
      { path: 'order.status', kind: 'changed', before: 'packed', after: null },
      { path: 'order.tracking', kind: 'changed', before: null, after: '1Z99' }
    ])
  })

  it('compares arrays by index, with added and removed items at the end', () => {
    expect(diffPayload({ items: [{ sku: 'A' }, { sku: 'B' }] }, { items: [{ sku: 'A' }, { sku: 'C' }, { sku: 'D' }] })).toEqual([
      { path: 'items[1].sku', kind: 'changed', before: 'B', after: 'C' },
      { path: 'items[2]', kind: 'added', after: { sku: 'D' } }
    ])
    expect(diffPayload([1, 2, 3], [1])).toEqual([
      { path: '[1]', kind: 'removed', before: 2 },
      { path: '[2]', kind: 'removed', before: 3 }
    ])
  })

  it('treats a type change as one change of the whole value', () => {
    expect(diffPayload({ a: { b: 1 } }, { a: [1] })).toEqual([
      { path: 'a', kind: 'changed', before: { b: 1 }, after: [1] }
    ])
    expect(diffPayload({ n: 1 }, { n: '1' })).toEqual([{ path: 'n', kind: 'changed', before: 1, after: '1' }])
  })

  it('quotes keys that are not plain names', () => {
    expect(diffPayload({ 'a.b': 1, 'my key': { x: 1 } }, { 'a.b': 2, 'my key': { x: 2 } })).toEqual([
      { path: '["a.b"]', kind: 'changed', before: 1, after: 2 },
      { path: '["my key"].x', kind: 'changed', before: 1, after: 2 }
    ])
  })

  it('names a change of a non-object payload with the empty path', () => {
    expect(diffPayload('plain', 'other')).toEqual([{ path: '', kind: 'changed', before: 'plain', after: 'other' }])
    expect(diffPayload(null, { a: 1 })).toEqual([{ path: '', kind: 'changed', before: null, after: { a: 1 } }])
  })
})

describe('lostValuePaths', () => {
  it('lists paths that became null or went away', () => {
    const changes = diffPayload({ order: { status: 'packed', note: 'x', id: 1 } }, { order: { status: null, id: 2 } })
    expect(lostValuePaths(changes)).toEqual(['order.status', 'order.note'])
  })
})
