import { describe, expect, it } from 'vitest'
import type { CodeGraph, CodeGraphNode } from '../types'
import { edgeWidth, highlightCounts, mergeEdges, nodeForSymbol, projectLayout } from './project-layout'

const node = (id: string, over: Partial<CodeGraphNode> = {}): CodeGraphNode => ({
  id,
  kind: 'namespace',
  name: id.replace(/^ns:/, '').split('\\').pop() ?? id,
  fqn: id.replace(/^ns:/, ''),
  depth: 0,
  ...over
})

const graph = (nodes: CodeGraphNode[], edges: CodeGraph['edges'] = []): CodeGraph => ({ nodes, edges, truncated: false })

describe('mergeEdges', () => {
  it('sums every kind between one pair into one line and drops self calls', () => {
    const out = mergeEdges(
      graph(
        [node('ns:A'), node('ns:B')],
        [
          { from: 'ns:A', to: 'ns:B', kind: 'calls', confidence: 'exact', count: 3 },
          { from: 'ns:A', to: 'ns:B', kind: 'instantiates', confidence: 'exact', count: 2 },
          { from: 'ns:A', to: 'ns:A', kind: 'calls', confidence: 'exact', count: 9 }
        ]
      )
    )
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ source: 'ns:A', target: 'ns:B', count: 5, guessed: false })
  })

  it('marks a line guessed only when every call on it is', () => {
    const e = (confidence: 'exact' | 'name') => ({ from: 'ns:A', to: 'ns:B', kind: 'calls' as const, confidence, count: 1 })
    expect(mergeEdges(graph([], [e('name'), e('name')]))[0].guessed).toBe(true)
    expect(mergeEdges(graph([], [e('name'), e('exact')]))[0].guessed).toBe(false)
  })
})

describe('edgeWidth', () => {
  it('grows from 2 to 6 px with the calls', () => {
    expect(edgeWidth(1)).toBeCloseTo(2.08, 2)
    expect(edgeWidth(24)).toBe(4)
    expect(edgeWidth(500)).toBe(6)
  })
})

describe('projectLayout', () => {
  it('lays boxes left to right along the calls, in positive space', () => {
    const l = projectLayout(
      graph([node('ns:A'), node('ns:B'), node('ns:Lonely')], [{ from: 'ns:A', to: 'ns:B', kind: 'calls', confidence: 'exact', count: 4 }])
    )
    const a = l.nodes.find((n) => n.id === 'ns:A')!
    const b = l.nodes.find((n) => n.id === 'ns:B')!
    expect(b.x).toBeGreaterThan(a.x)
    expect(a.callsOut).toBe(4)
    expect(b.callsIn).toBe(4)
    expect(l.nodes.every((n) => n.x > 0 && n.y > 0)).toBe(true)
    // A box with no calls is still drawn.
    expect(l.nodes.map((n) => n.id)).toContain('ns:Lonely')
  })

  it('tells boxes that open from functions that focus', () => {
    const l = projectLayout(
      graph([
        node('ns:A', { size: 3 }),
        node('ns:Empty', { size: 0 }),
        node('s:1', { kind: 'class', symbol_id: 1, size: 2 }),
        node('s:2', { kind: 'method', symbol_id: 2 }),
        node('x:Vendor', { kind: 'external', external: true })
      ])
    )
    const by = (id: string) => l.nodes.find((n) => n.id === id)!
    expect(by('ns:A')).toMatchObject({ expandable: true, callable: false })
    expect(by('ns:Empty').expandable).toBe(false)
    expect(by('s:1')).toMatchObject({ expandable: true, callable: false })
    expect(by('s:2')).toMatchObject({ expandable: false, callable: true })
    expect(by('x:Vendor')).toMatchObject({ expandable: false, callable: false })
  })

  it('draws an opened box as a frame around what it holds, nested frames inside', () => {
    const info = new Map([
      ['ns:App\\Service', { id: 'ns:App\\Service', kind: 'namespace', name: 'Service', fqn: 'App\\Service' }],
      ['s:10', { id: 's:10', kind: 'class', name: 'Checkout', fqn: 'App\\Service\\Checkout', parent: 'ns:App\\Service' }]
    ])
    const l = projectLayout(
      graph(
        [
          node('ns:App\\Http'),
          node('s:11', { kind: 'class', symbol_id: 11, name: 'Mailer', fqn: 'App\\Service\\Mailer', group: 'ns:App\\Service' }),
          node('s:12', { kind: 'method', symbol_id: 12, name: 'run', fqn: 'App\\Service\\Checkout::run', group: 's:10' }),
          node('s:13', { kind: 'method', symbol_id: 13, name: 'pay', fqn: 'App\\Service\\Checkout::pay', group: 's:10' })
        ],
        [
          { from: 'ns:App\\Http', to: 's:12', kind: 'calls', confidence: 'exact', count: 1 },
          { from: 's:12', to: 's:13', kind: 'calls', confidence: 'exact', count: 1 },
          { from: 's:13', to: 's:11', kind: 'calls', confidence: 'exact', count: 1 }
        ]
      ),
      info
    )
    expect(l.groups.map((g) => g.id)).toEqual(['ns:App\\Service', 's:10'])
    const [outer, inner] = l.groups
    expect(inner.depth).toBe(1)
    const inside = (g: typeof outer, x: number, y: number) => x > g.x && x < g.x + g.width && y > g.y && y < g.y + g.height
    for (const id of ['s:12', 's:13']) {
      const n = l.nodes.find((x) => x.id === id)!
      expect(inside(inner, n.x, n.y)).toBe(true)
    }
    const mailer = l.nodes.find((x) => x.id === 's:11')!
    expect(inside(outer, mailer.x, mailer.y)).toBe(true)
    expect(inside(inner, mailer.x, mailer.y)).toBe(false)
    expect(inner.x).toBeGreaterThan(outer.x)
    expect(inner.x + inner.width).toBeLessThan(outer.x + outer.width)
    const http = l.nodes.find((x) => x.id === 'ns:App\\Http')!
    expect(inside(outer, http.x, http.y)).toBe(false)
  })
})

describe('nodeForSymbol', () => {
  const l = projectLayout(
    graph([
      node('ns:App'),
      node('ns:App\\Service'),
      node('ns:App\\ServiceProvider'),
      node('ns:github.com/x/internal/event', { kind: 'package', name: 'event' }),
      node('s:7', { kind: 'method', symbol_id: 7, fqn: 'App\\Http\\Cart::add' })
    ])
  )

  it('finds the symbol itself when drawn', () => {
    expect(nodeForSymbol(l.nodes, { id: 7, fqn: 'App\\Http\\Cart::add' })).toBe('s:7')
  })

  it('finds the longest folded box the name sits in, on a name boundary', () => {
    expect(nodeForSymbol(l.nodes, { id: 1, fqn: 'App\\Service\\Checkout::run' })).toBe('ns:App\\Service')
    expect(nodeForSymbol(l.nodes, { id: 2, fqn: 'App\\ServiceProvider\\Boot' })).toBe('ns:App\\ServiceProvider')
    expect(nodeForSymbol(l.nodes, { id: 3, fqn: 'App\\Kernel' })).toBe('ns:App')
    expect(nodeForSymbol(l.nodes, { id: 4, fqn: 'github.com/x/internal/event.(*Store).Save' })).toBe('ns:github.com/x/internal/event')
    expect(nodeForSymbol(l.nodes, { id: 5, fqn: 'github.com/x/internal/events.Bus' })).toBeNull()
  })

  it('counts found symbols per box', () => {
    const c = highlightCounts(l.nodes, [
      { id: 1, fqn: 'App\\Service\\A::x' },
      { id: 2, fqn: 'App\\Service\\B::y' },
      { id: 7, fqn: 'App\\Http\\Cart::add' }
    ])
    expect(c.get('ns:App\\Service')).toBe(2)
    expect(c.get('s:7')).toBe(1)
  })
})
