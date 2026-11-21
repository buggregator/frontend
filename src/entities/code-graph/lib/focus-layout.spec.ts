import { describe, expect, it } from 'vitest'
import type { CodeGraph, CodeGraphEdge, CodeGraphNode } from '../types'
import { COL_STEP, ROW_STEP, layoutFocusGraph, pathToFocus } from './focus-layout'

const node = (id: string, depth: number, extra: Partial<CodeGraphNode> = {}): CodeGraphNode => ({
  id,
  kind: 'method',
  name: id,
  fqn: `App\\${id}`,
  depth,
  ...extra
})
const edge = (from: string, to: string, extra: Partial<CodeGraphEdge> = {}): CodeGraphEdge => ({
  from,
  to,
  kind: 'calls',
  confidence: 'exact',
  count: 1,
  ...extra
})
const graph = (nodes: CodeGraphNode[], edges: CodeGraphEdge[], truncated = false): CodeGraph => ({ nodes, edges, truncated })

const F = 's:1'

describe('layoutFocusGraph', () => {
  it('puts callers left, the focus in the middle, callees right', () => {
    const callers = graph([node(F, 0), node('s:2', 1)], [edge('s:2', F)])
    const callees = graph([node(F, 0), node('s:3', 1), node('s:4', 2)], [edge(F, 's:3'), edge('s:3', 's:4')])
    const out = layoutFocusGraph({ focus: F, callers, callees })
    const pos = Object.fromEntries(out.nodes.map((n) => [n.id, [n.column, n.x]]))
    expect(pos).toEqual({ [F]: [0, 0], 's:2': [-1, -COL_STEP], 's:3': [1, COL_STEP], 's:4': [2, 2 * COL_STEP] })
    expect(out.nodes.find((n) => n.id === F)?.role).toBe('focus')
  })

  it('centres each column on the focus row', () => {
    const callees = graph([node(F, 0), node('s:3', 1), node('s:4', 1)], [edge(F, 's:3'), edge(F, 's:4')])
    const ys = layoutFocusGraph({ focus: F, callers: null, callees }).nodes.filter((n) => n.column === 1).map((n) => n.y)
    expect(ys).toEqual([-ROW_STEP / 2, ROW_STEP / 2])
  })

  it('orders a column by call count, most first', () => {
    const callers = graph(
      [node(F, 0), node('s:2', 1), node('s:3', 1)],
      [edge('s:2', F, { count: 1 }), edge('s:3', F, { count: 9 })]
    )
    const col = layoutFocusGraph({ focus: F, callers, callees: null }).nodes.filter((n) => n.column === -1)
    expect(col.map((n) => n.id)).toEqual(['s:3', 's:2'])
  })

  it('folds a long column into «+N more», counting the known total', () => {
    const many = Array.from({ length: 12 }, (_, i) => node(`s:${10 + i}`, 1))
    const callers = graph([node(F, 0), ...many], many.map((n) => edge(n.id, F)))
    const out = layoutFocusGraph({ focus: F, callers, callees: null, perColumn: 8, totals: { callers: 312 } })
    const col = out.nodes.filter((n) => n.column === -1)
    expect(col).toHaveLength(9)
    expect(col[8]).toMatchObject({ role: 'more', more: 304, id: 'more:-1' })
    // Edges only between drawn nodes; the «more» node gets one edge to the focus.
    expect(out.edges.filter((e) => e.target === F)).toHaveLength(9)
  })

  it('shows a whole column once it is expanded', () => {
    const many = Array.from({ length: 12 }, (_, i) => node(`s:${10 + i}`, 1))
    const callers = graph([node(F, 0), ...many], many.map((n) => edge(n.id, F)))
    const out = layoutFocusGraph({ focus: F, callers, callees: null, perColumn: 8, expanded: [-1] })
    expect(out.nodes.filter((n) => n.column === -1)).toHaveLength(12)
  })

  it('drops deeper nodes whose link to the focus was folded away', () => {
    const many = Array.from({ length: 3 }, (_, i) => node(`s:${10 + i}`, 1))
    const callers = graph(
      [node(F, 0), ...many, node('s:99', 2)],
      [...many.map((n, i) => edge(n.id, F, { count: 10 - i })), edge('s:99', 's:12')]
    )
    const out = layoutFocusGraph({ focus: F, callers, callees: null, perColumn: 2 })
    expect(out.nodes.map((n) => n.id)).not.toContain('s:99')
  })

  it('marks guessed links and nodes reached only by name', () => {
    const callees = graph(
      [node(F, 0), node('s:3', 1), node('s:4', 1)],
      [edge(F, 's:3', { confidence: 'name' }), edge(F, 's:4')]
    )
    const out = layoutFocusGraph({ focus: F, callers: null, callees })
    expect(out.edges.find((e) => e.target === 's:3')?.guessed).toBe(true)
    expect(out.nodes.find((n) => n.id === 's:3')?.guessed).toBe(true)
    expect(out.nodes.find((n) => n.id === 's:4')?.guessed).toBe(false)
  })

  it('keeps a node that both calls and is called on the callers side only', () => {
    const callers = graph([node(F, 0), node('s:2', 1)], [edge('s:2', F)])
    const callees = graph([node(F, 0), node('s:2', 1)], [edge(F, 's:2')])
    const out = layoutFocusGraph({ focus: F, callers, callees })
    expect(out.nodes.filter((n) => n.id === 's:2')).toHaveLength(1)
    expect(out.edges).toHaveLength(2)
  })

  it('places a deeper node next to the node it links to', () => {
    const callees = graph(
      [node(F, 0), node('s:3', 1), node('s:4', 1), node('s:5', 2)],
      [edge(F, 's:3', { count: 5 }), edge(F, 's:4', { count: 1 }), edge('s:4', 's:5')]
    )
    const out = layoutFocusGraph({ focus: F, callers: null, callees })
    const y = (id: string) => out.nodes.find((n) => n.id === id)!.y
    expect(y('s:5')).toBe(y('s:4'))
  })
})

describe('pathToFocus', () => {
  const callers = graph(
    [node(F, 0), node('s:2', 1), node('s:3', 1), node('s:4', 2)],
    [edge('s:2', F), edge('s:3', F), edge('s:4', 's:2')]
  )
  const callees = graph([node(F, 0), node('s:5', 1), node('s:6', 2)], [edge(F, 's:5'), edge('s:5', 's:6')])
  const layout = layoutFocusGraph({ focus: F, callers, callees })

  it('walks a caller toward the focus', () => {
    const p = pathToFocus(layout, 's:4')
    expect([...p.nodes].sort()).toEqual(['s:1', 's:2', 's:4'])
    expect([...p.edges].sort()).toEqual(['s:2->s:1', 's:4->s:2'])
  })

  it('walks a callee back to the focus', () => {
    expect([...pathToFocus(layout, 's:6').nodes].sort()).toEqual(['s:1', 's:5', 's:6'])
  })

  it('lights the direct links of the focus', () => {
    expect(pathToFocus(layout, F).edges.size).toBe(3)
  })
})
