import { describe, expect, it } from 'vitest'
import type { MockRule } from '../types'
import { buildImport, groupHeaderAt, storedGroupSizes } from './mock-openapi'

const rule = (id: string, group = '', readOnly = false): MockRule => ({
  id, project: '', name: id, method: 'GET', path: `/${id}`, status: 200, headers: {}, body: '',
  delay_ms: 0, enabled: true, position: 0, source: readOnly ? 'config' : 'api', read_only: readOnly, group,
})

describe('groupHeaderAt', () => {
  const list = [rule('a'), rule('b', 'openapi:Shop'), rule('c', 'openapi:Shop'), rule('d'), rule('e', 'openapi:Shop')]

  it('opens a header where a group run starts', () => {
    expect(list.map((_, i) => groupHeaderAt(list, i))).toEqual([null, 'openapi:Shop', null, null, 'openapi:Shop'])
  })

  it('reads rules of an older server without a group as ungrouped', () => {
    const old = rule('x')
    delete (old as Partial<MockRule>).group
    expect(groupHeaderAt([old], 0)).toBeNull()
  })
})

describe('storedGroupSizes', () => {
  // A re-import and a group delete touch only stored rules, never yaml ones.
  it('counts editable rules per group', () => {
    const sizes = storedGroupSizes([rule('a', 'g1'), rule('b', 'g1'), rule('y', 'g1', true), rule('c', 'g2'), rule('d')])
    expect(sizes).toEqual(new Map([['g1', 2], ['g2', 1]]))
  })
})

describe('buildImport', () => {
  const base = { source: 'paste' as const, spec: 'openapi: 3.0.0', url: 'https://x/spec.json', project: '', group: '', fromServers: true, basePath: '' }

  it('sends the pasted spec only, without empty optional fields', () => {
    expect(buildImport(base)).toEqual({ spec: 'openapi: 3.0.0' })
  })

  it('sends the url only for the url source', () => {
    expect(buildImport({ ...base, source: 'url', url: '  https://x/spec.json ' })).toEqual({ url: 'https://x/spec.json' })
  })

  it('keeps project and a trimmed group', () => {
    expect(buildImport({ ...base, project: 'shop', group: ' Shop v1 ' })).toMatchObject({ project: 'shop', group: 'Shop v1' })
  })

  // base_path absent = path of servers[0].url; "" = no prefix.
  it('sends base_path only when the servers path is not used', () => {
    expect(buildImport(base)).not.toHaveProperty('base_path')
    expect(buildImport({ ...base, fromServers: false })).toMatchObject({ base_path: '' })
    expect(buildImport({ ...base, fromServers: false, basePath: ' /api ' })).toMatchObject({ base_path: '/api' })
  })
})
