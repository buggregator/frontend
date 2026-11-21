import { describe, expect, it } from 'vitest'
import type { CodeGraphRoots, CodeRootStatus } from '@/entities/code-graph'
import { pickedRoot, rootStamp } from './picked-root'

const r = (name: string, state: CodeRootStatus['state'], extra: Partial<CodeRootStatus> = {}): CodeRootStatus => ({
  name,
  path: `/w/${name}`,
  state,
  ...extra
})
const roots = (...list: CodeRootStatus[]): CodeGraphRoots => ({ enabled: true, snippets: false, roots: list })

describe('pickedRoot', () => {
  it('takes the asked one, else the first indexed, else the first', () => {
    const all = roots(r('new', 'indexing'), r('shop', 'ready'))
    expect(pickedRoot(all, 'new')?.name).toBe('new')
    expect(pickedRoot(all, 'gone')?.name).toBe('shop')
    expect(pickedRoot(all, null)?.name).toBe('shop')
    expect(pickedRoot(roots(r('a', 'pending')), null)?.name).toBe('a')
    expect(pickedRoot(roots(), null)).toBeNull()
    expect(pickedRoot(null, 'x')).toBeNull()
  })
})

describe('rootStamp', () => {
  it('changes when indexing ends, not while files are counted', () => {
    const a = rootStamp(r('shop', 'indexing', { files_seen: 3 }))
    expect(rootStamp(r('shop', 'indexing', { files_seen: 9 }))).toBe(a)
    expect(rootStamp(r('shop', 'ready', { indexed_at: 't1' }))).not.toBe(a)
  })
})
