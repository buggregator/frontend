import { describe, expect, it } from 'vitest'
import type { CodeGraph, CodeGraphNode } from '../types'
import { foldFolders } from './fold-folders'

const M = 'github.com/x/app'
const pkg = (path: string, over: Partial<CodeGraphNode> = {}): CodeGraphNode => ({
  id: `ns:${M}${path}`,
  kind: 'package',
  name: path.split('/').pop() || 'app',
  fqn: `${M}${path}`,
  depth: 0,
  size: 2,
  ...over
})

const g = (nodes: CodeGraphNode[], edges: CodeGraph['edges'] = []): CodeGraph => ({ nodes, edges, truncated: false })
const call = (a: string, b: string, count = 1) => ({
  from: `ns:${M}${a}`,
  to: `ns:${M}${b}`,
  kind: 'calls' as const,
  confidence: 'exact' as const,
  count
})

const graph = g(
  [pkg(''), pkg('/cmd/server'), pkg('/internal/a'), pkg('/internal/b'), pkg('/internal/c'), pkg('/modules/x'), pkg('/modules/y')],
  [call('/cmd/server', '/internal/a', 2), call('/cmd/server', '/internal/b', 3), call('/internal/a', '/internal/b', 7), call('/modules/x', '/internal/c')]
)

describe('foldFolders', () => {
  it('leaves a small root as it is', () => {
    expect(foldFolders(graph, new Set(), 12).graph).toBe(graph)
  })

  it('draws packages of one folder as that folder, lines summed, inner lines dropped', () => {
    const { graph: out } = foldFolders(graph, new Set(), 3)
    const ids = out.nodes.map((n) => n.id).sort()
    // The root package and a lone package stay; the rest fold.
    expect(ids).toEqual([`dir:${M}/internal`, `dir:${M}/modules`, `ns:${M}`, `ns:${M}/cmd/server`].sort())
    const internal = out.nodes.find((n) => n.id === `dir:${M}/internal`)!
    expect(internal).toMatchObject({ kind: 'folder', name: 'internal', fqn: `${M}/internal`, size: 6 })
    expect(out.edges).toEqual([
      expect.objectContaining({ from: `ns:${M}/cmd/server`, to: `dir:${M}/internal`, count: 5 }),
      expect.objectContaining({ from: `dir:${M}/modules`, to: `dir:${M}/internal`, count: 1 })
    ])
  })

  it('an open folder is a frame around its packages', () => {
    const { graph: out, groups } = foldFolders(graph, new Set([`dir:${M}/internal`]), 3)
    expect(out.nodes.find((n) => n.id === `ns:${M}/internal/a`)?.group).toBe(`dir:${M}/internal`)
    expect(groups.get(`dir:${M}/internal`)).toMatchObject({ kind: 'folder', name: 'internal' })
    // The package frame (when the server opens it) sits in the folder frame.
    expect(groups.get(`ns:${M}/internal/a`)?.parent).toBe(`dir:${M}/internal`)
    expect(out.edges).toContainEqual(expect.objectContaining({ from: `ns:${M}/internal/a`, to: `ns:${M}/internal/b`, count: 7 }))
  })

  it('keeps nodes the server drew from an opened package', () => {
    const opened = g([...graph.nodes, { id: 's:5', kind: 'struct', name: 'S', fqn: `${M}/internal/a.S`, depth: 0, group: `ns:${M}/internal/a` }])
    const { graph: out } = foldFolders(opened, new Set([`dir:${M}/internal`]), 3)
    expect(out.nodes.find((n) => n.id === 's:5')?.group).toBe(`ns:${M}/internal/a`)
  })

  it('names a folder by the whole path its packages share', () => {
    const other = (fqn: string): CodeGraphNode => ({ id: `ns:${fqn}`, kind: 'namespace', name: fqn, fqn, depth: 0, size: 1 })
    const mixed = g([...graph.nodes, other('App\\A'), other('App\\B')])
    const { graph: out } = foldFolders(mixed, new Set(), 3)
    expect(out.nodes.map((n) => n.id)).toContain(`dir:${M}`)
    expect(out.nodes.find((n) => n.id === `dir:${M}`)).toMatchObject({ name: 'app', fqn: M })
  })

  it('splits PHP namespaces the same way', () => {
    const ns = (fqn: string): CodeGraphNode => ({ id: `ns:${fqn}`, kind: 'namespace', name: fqn, fqn, depth: 0, size: 1 })
    const { graph: out } = foldFolders(g([ns('App\\Http\\A'), ns('App\\Http\\B'), ns('App\\Service')]), new Set(), 2)
    expect(out.nodes.map((n) => n.id).sort()).toEqual(['dir:App/Http', 'ns:App\\Service'])
    expect(out.nodes.find((n) => n.id === 'dir:App/Http')?.fqn).toBe('App\\Http')
  })

  it('puts a namespace into the folder of the same name', () => {
    const ns = (fqn: string): CodeGraphNode => ({ id: `ns:${fqn}`, kind: 'namespace', name: fqn, fqn, depth: 0, size: 1 })
    const { graph: out } = foldFolders(g([ns('App'), ns('App\\Models'), ns('App\\Http'), ns('Tests'), ns('Tests\\Feature')]), new Set(), 2)
    expect(out.nodes.map((n) => n.id).sort()).toEqual(['dir:App', 'dir:Tests'])
  })

  it('still folds when a package is open (the server leaves it out)', () => {
    const a = `ns:${M}/internal/a`
    const info = new Map([[a, { id: a, kind: 'package', name: 'a', fqn: `${M}/internal/a` }]])
    const opened = g([
      ...graph.nodes.filter((n) => n.id !== a),
      { id: 's:5', kind: 'struct', name: 'S', fqn: `${M}/internal/a.S`, depth: 0, symbol_id: 5, group: a }
    ])
    // Folder open: the package frame sits in it.
    const inOpen = foldFolders(opened, new Set([`dir:${M}/internal`]), 3, info)
    expect(inOpen.graph.nodes.find((n) => n.id === 's:5')?.group).toBe(a)
    expect(inOpen.groups.get(a)).toMatchObject({ name: 'a', parent: `dir:${M}/internal` })
    // Folder closed: what came from it is drawn as the folder.
    const inClosed = foldFolders(opened, new Set(), 3, info)
    expect(inClosed.graph.nodes.map((n) => n.id)).not.toContain('s:5')
    expect(inClosed.graph.nodes.map((n) => n.id)).toContain(`dir:${M}/internal`)
  })
})
