import type { CodeGraph, CodeGraphEdge, CodeGraphNode } from '../types'

// Variant A of #6573: one symbol in focus, callers in columns to the left,
// callees to the right, one column per hop. Own layout (no dagre): node
// 172×64, column step 220, row step 80. A column longer than `perColumn`
// ends with a «+N more» node until it is expanded.

export const NODE_W = 172
export const NODE_H = 64
export const COL_STEP = 220
export const ROW_STEP = 80

export type FocusNode = {
  id: string
  // Negative: callers, hops to the left; positive: callees.
  column: number
  x: number
  y: number
  role: 'focus' | 'node' | 'more'
  // Every link to it from the focus side is a guess by method name.
  guessed: boolean
  // Calls between it and its neighbour toward the focus.
  calls: number
  data: CodeGraphNode | null
  // Folded nodes, on a «more» node.
  more?: number
}

export type FocusEdge = {
  id: string
  source: string
  target: string
  kind: CodeGraphEdge['kind'] | 'more'
  count: number
  guessed: boolean
}

export type FocusLayout = { nodes: FocusNode[]; edges: FocusEdge[]; truncated: boolean }

export type FocusLayoutInput = {
  focus: string
  callers: CodeGraph | null
  callees: CodeGraph | null
  perColumn?: number
  // Columns shown whole (column numbers, e.g. -1 for direct callers).
  expanded?: number[]
  // Known totals of direct callers and callees (symbol detail).
  totals?: { callers?: number; callees?: number }
}

type Side = { sign: -1 | 1; graph: CodeGraph | null; total?: number }

const edgeId = (e: { source: string; target: string }) => `${e.source}->${e.target}`

export const layoutFocusGraph = ({
  focus,
  callers,
  callees,
  perColumn = 8,
  expanded = [],
  totals = {}
}: FocusLayoutInput): FocusLayout => {
  const focusData =
    callers?.nodes.find((n) => n.id === focus) ?? callees?.nodes.find((n) => n.id === focus) ?? null
  const placed = new Map<string, FocusNode>()
  placed.set(focus, { id: focus, column: 0, x: 0, y: 0, role: 'focus', guessed: false, calls: 0, data: focusData })
  const nodes: FocusNode[] = [placed.get(focus)!]
  const edges: FocusEdge[] = []

  const sides: Side[] = [
    { sign: -1, graph: callers, total: totals.callers },
    { sign: 1, graph: callees, total: totals.callees }
  ]

  for (const { sign, graph, total } of sides) {
    if (!graph) continue
    const byId = new Map(graph.nodes.map((n) => [n.id, n]))
    // Toward-focus neighbour of an edge end: for callers the edge points at
    // the focus (from = farther), for callees it points away (to = farther).
    const far = (e: CodeGraphEdge) => (sign < 0 ? e.from : e.to)
    const near = (e: CodeGraphEdge) => (sign < 0 ? e.to : e.from)
    const maxDepth = Math.max(0, ...graph.nodes.map((n) => n.depth))

    for (let depth = 1; depth <= maxDepth; depth++) {
      const column = sign * depth
      // Candidates: nodes of this depth linked to a node already drawn in the
      // previous column (or the focus), not drawn on the other side already.
      const links = new Map<string, CodeGraphEdge[]>()
      for (const e of graph.edges) {
        const f = far(e)
        const n = near(e)
        const fNode = byId.get(f)
        const nPlaced = placed.get(n)
        if (!fNode || fNode.depth !== depth || !nPlaced || nPlaced.role === 'more') continue
        if (nPlaced.column !== sign * (depth - 1)) continue
        if (placed.has(f)) continue
        const list = links.get(f) ?? []
        list.push(e)
        links.set(f, list)
      }

      const ids = [...links.keys()]
      const calls = (id: string) => links.get(id)!.reduce((s, e) => s + e.count, 0)
      const want = (id: string) => {
        const ys = links.get(id)!.map((e) => placed.get(near(e))!.y)
        return ys.reduce((a, b) => a + b, 0) / ys.length
      }
      ids.sort((a, b) => (depth === 1 ? 0 : want(a) - want(b)) || calls(b) - calls(a) || a.localeCompare(b))

      const open = expanded.includes(column)
      const shown = open || ids.length <= perColumn ? ids : ids.slice(0, perColumn)
      const hidden = ids.length - shown.length
      const knownMore = depth === 1 && total !== undefined ? Math.max(0, total - shown.length) : 0
      const more = open ? 0 : Math.max(hidden, knownMore)

      const colNodes: FocusNode[] = shown.map((id) => {
        const es = links.get(id)!
        return {
          id,
          column,
          x: column * COL_STEP,
          y: 0,
          role: 'node',
          guessed: es.every((e) => e.confidence === 'name'),
          calls: calls(id),
          data: byId.get(id) ?? null
        }
      })
      if (more > 0) {
        colNodes.push({ id: `more:${column}`, column, x: column * COL_STEP, y: 0, role: 'more', guessed: false, calls: 0, data: null, more })
      }

      // Rows: direct neighbours centred on the focus; deeper ones next to the
      // node they link to, pushed down just enough not to overlap.
      if (depth === 1) {
        colNodes.forEach((n, i) => {
          n.y = (i - (colNodes.length - 1) / 2) * ROW_STEP
        })
      } else {
        let prev = -Infinity
        for (const n of colNodes) {
          const target = n.role === 'more' ? prev + ROW_STEP : want(n.id)
          n.y = Math.max(target, prev + ROW_STEP)
          prev = n.y
        }
      }

      for (const n of colNodes) {
        placed.set(n.id, n)
        nodes.push(n)
      }
      for (const id of shown) {
        for (const e of links.get(id)!) {
          const out = { source: e.from, target: e.to, kind: e.kind, count: e.count, guessed: e.confidence === 'name' }
          edges.push({ id: edgeId(out), ...out })
        }
      }
      if (more > 0) {
        // One edge between the «more» node and the neighbour the folded ones link to.
        const firstHidden = ids[shown.length]
        const anchor = firstHidden ? near(links.get(firstHidden)![0]) : focus
        const moreId = `more:${column}`
        const out = sign < 0 ? { source: moreId, target: anchor } : { source: anchor, target: moreId }
        edges.push({ id: edgeId(out), ...out, kind: 'more', count: 0, guessed: false })
      }
    }
  }

  // Links between nodes drawn anyway (a caller that is also a callee, a cycle).
  const drawn = new Set(edges.map((e) => e.id))
  for (const graph of [callers, callees]) {
    for (const e of graph?.edges ?? []) {
      const out = { source: e.from, target: e.to }
      const id = edgeId(out)
      if (drawn.has(id) || !placed.has(e.from) || !placed.has(e.to)) continue
      drawn.add(id)
      edges.push({ id, ...out, kind: e.kind, count: e.count, guessed: e.confidence === 'name' })
    }
  }

  return { nodes, edges, truncated: !!callers?.truncated || !!callees?.truncated }
}

// Nodes and edges on the way from a node to the focus: for a caller, the
// calls it makes toward the focus; for a callee, the calls that reach it.
export const pathToFocus = (layout: FocusLayout, id: string): { nodes: Set<string>; edges: Set<string> } => {
  const nodes = new Set<string>([id])
  const edges = new Set<string>()
  const node = layout.nodes.find((n) => n.id === id)
  if (!node || node.column === 0) {
    // The focus: its direct links light up.
    for (const e of layout.edges) {
      if (e.source === id || e.target === id) {
        edges.add(e.id)
        nodes.add(e.source)
        nodes.add(e.target)
      }
    }
    return { nodes, edges }
  }
  const column = new Map(layout.nodes.map((n) => [n.id, n.column]))
  const toward = node.column < 0 ? 1 : -1
  const queue = [id]
  while (queue.length) {
    const cur = queue.shift()!
    const c = column.get(cur)!
    for (const e of layout.edges) {
      const next = node.column < 0 ? (e.source === cur ? e.target : null) : e.target === cur ? e.source : null
      if (!next || column.get(next) !== c + toward) continue
      edges.add(e.id)
      if (!nodes.has(next)) {
        nodes.add(next)
        if (column.get(next) !== 0) queue.push(next)
      }
    }
  }
  return { nodes, edges }
}
