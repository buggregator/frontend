import Dagre from '@dagrejs/dagre'
import type { CodeGraph, CodeGraphNode, CodeSymbol } from '../types'

// The whole graph of one root (#6577 «whole»): namespaces or packages as
// boxes, calls between them as lines with counts. An opened box becomes a
// frame around what it holds (classes, then methods); everything else stays
// folded. Layout: dagre left to right, the #6531 V1 sizes.

export const PROJECT_NODE_W = 200
export const PROJECT_NODE_H = 64
const GROUP_PAD = 14
const GROUP_LABEL = 24
const MARGIN = 24

// What a frame says about the box it came from; the server leaves the opened
// node out, so the page keeps this from the answer before.
export type ProjectGroupInfo = { id: string; kind: string; name: string; fqn: string; parent?: string }

export type ProjectNode = {
  id: string
  x: number
  y: number
  node: CodeGraphNode
  // Folds more inside: a click opens it.
  expandable: boolean
  // A function or method: a click opens the focus view.
  callable: boolean
  callsIn: number
  callsOut: number
}

export type ProjectGroup = ProjectGroupInfo & { x: number; y: number; width: number; height: number; depth: number }

export type ProjectEdge = {
  id: string
  source: string
  target: string
  count: number
  // Every call on it was matched by method name only.
  guessed: boolean
  width: number
}

export type ProjectLayout = {
  nodes: ProjectNode[]
  groups: ProjectGroup[]
  edges: ProjectEdge[]
  truncated: boolean
}

const CONTAINER = new Set(['folder', 'namespace', 'package', 'class', 'interface', 'trait', 'enum', 'struct', 'type', 'file'])
const CALLABLE = new Set(['function', 'method'])

// V1 (#6531): line width grows with the calls on it, 2 to 6 px.
export const edgeWidth = (count: number) => Math.min(6, 2 + count / 12)

const isExternal = (n: CodeGraphNode) => !!n.external || n.kind === 'external'

export const isExpandable = (n: CodeGraphNode) =>
  !isExternal(n) && CONTAINER.has(n.kind) && (n.size === undefined || n.size > 0)

export const isCallable = (n: CodeGraphNode) => !isExternal(n) && CALLABLE.has(n.kind) && !!n.symbol_id

// One line per pair of boxes: calls of every kind summed.
export const mergeEdges = (graph: CodeGraph): ProjectEdge[] => {
  const byPair = new Map<string, ProjectEdge>()
  for (const e of graph.edges) {
    if (e.from === e.to) continue
    const id = `${e.from}->${e.to}`
    const cur = byPair.get(id)
    if (cur) {
      cur.count += e.count
      cur.guessed = cur.guessed && e.confidence === 'name'
    } else {
      byPair.set(id, { id, source: e.from, target: e.to, count: e.count, guessed: e.confidence === 'name', width: 0 })
    }
  }
  const out = [...byPair.values()]
  for (const e of out) e.width = edgeWidth(e.count)
  return out
}

export const projectLayout = (graph: CodeGraph, groupInfo: ReadonlyMap<string, ProjectGroupInfo> = new Map()): ProjectLayout => {
  const known = new Set(graph.nodes.map((n) => n.id))
  const edges = mergeEdges(graph).filter((e) => known.has(e.source) && known.has(e.target))

  // Frames: every group a node names, and the frames those sit in.
  const groups = new Map<string, ProjectGroupInfo>()
  const addGroup = (id: string) => {
    if (groups.has(id) || known.has(id)) return
    const info = groupInfo.get(id) ?? { id, kind: 'namespace', name: id, fqn: id }
    groups.set(id, info)
    if (info.parent) addGroup(info.parent)
  }
  for (const n of graph.nodes) if (n.group) addGroup(n.group)

  const g = new Dagre.graphlib.Graph({ compound: true })
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: groups.size ? 60 : 28, ranksep: 110, marginx: 0, marginy: 0 })
  for (const n of graph.nodes) g.setNode(n.id, { width: PROJECT_NODE_W, height: PROJECT_NODE_H })
  for (const id of groups.keys()) g.setNode(id, {})
  for (const n of graph.nodes) if (n.group && groups.has(n.group)) g.setParent(n.id, n.group)
  for (const [id, info] of groups) if (info.parent && groups.has(info.parent)) g.setParent(id, info.parent)
  for (const e of edges) g.setEdge(e.source, e.target)
  Dagre.layout(g)

  const callsIn = new Map<string, number>()
  const callsOut = new Map<string, number>()
  for (const e of edges) {
    callsOut.set(e.source, (callsOut.get(e.source) ?? 0) + e.count)
    callsIn.set(e.target, (callsIn.get(e.target) ?? 0) + e.count)
  }

  const nodes: ProjectNode[] = graph.nodes.map((n) => {
    const p = g.node(n.id)
    return {
      id: n.id,
      x: p.x,
      y: p.y,
      node: n,
      expandable: isExpandable(n),
      callable: isCallable(n),
      callsIn: callsIn.get(n.id) ?? 0,
      callsOut: callsOut.get(n.id) ?? 0
    }
  })

  // Frame boxes from what they hold (dagre keeps a group together but leaves
  // no room for a title), inner frames first.
  const depthOf = (id: string): number => {
    const parent = groups.get(id)?.parent
    return parent && groups.has(parent) ? depthOf(parent) + 1 : 0
  }
  const boxes = new Map<string, { x1: number; y1: number; x2: number; y2: number }>()
  const grow = (id: string, x1: number, y1: number, x2: number, y2: number) => {
    const b = boxes.get(id)
    boxes.set(id, b ? { x1: Math.min(b.x1, x1), y1: Math.min(b.y1, y1), x2: Math.max(b.x2, x2), y2: Math.max(b.y2, y2) } : { x1, y1, x2, y2 })
  }
  for (const n of nodes) {
    if (n.node.group && groups.has(n.node.group)) {
      grow(n.node.group, n.x - PROJECT_NODE_W / 2, n.y - PROJECT_NODE_H / 2, n.x + PROJECT_NODE_W / 2, n.y + PROJECT_NODE_H / 2)
    }
  }
  const order = [...groups.keys()].sort((a, b) => depthOf(b) - depthOf(a))
  const framed: ProjectGroup[] = []
  for (const id of order) {
    const b = boxes.get(id)
    if (!b) continue
    const box = { x1: b.x1 - GROUP_PAD, y1: b.y1 - GROUP_PAD - GROUP_LABEL, x2: b.x2 + GROUP_PAD, y2: b.y2 + GROUP_PAD }
    const info = groups.get(id)!
    if (info.parent && groups.has(info.parent)) grow(info.parent, box.x1, box.y1, box.x2, box.y2)
    framed.push({ ...info, x: box.x1, y: box.y1, width: box.x2 - box.x1, height: box.y2 - box.y1, depth: depthOf(id) })
  }

  // Everything into positive space with a margin.
  const minX = Math.min(...nodes.map((n) => n.x - PROJECT_NODE_W / 2), ...framed.map((f) => f.x))
  const minY = Math.min(...nodes.map((n) => n.y - PROJECT_NODE_H / 2), ...framed.map((f) => f.y))
  const dx = Number.isFinite(minX) ? MARGIN - minX : 0
  const dy = Number.isFinite(minY) ? MARGIN - minY : 0
  for (const n of nodes) {
    n.x += dx
    n.y += dy
  }
  for (const f of framed) {
    f.x += dx
    f.y += dy
  }

  // Outer frames first so inner ones draw over them.
  framed.sort((a, b) => a.depth - b.depth)
  return { nodes, groups: framed, edges, truncated: graph.truncated }
}

// Where a found symbol sits in the drawn graph: its own box, or the folded
// box whose name it starts with (the longest one).
const SEP = /^(\\|\/|\.|::)/
export const nodeForSymbol = (nodes: readonly ProjectNode[], s: Pick<CodeSymbol, 'id' | 'fqn'>): string | null => {
  const own = nodes.find((n) => n.node.symbol_id === s.id || n.id === `s:${s.id}`)
  if (own) return own.id
  let best: ProjectNode | null = null
  for (const n of nodes) {
    const fqn = n.node.fqn
    if (!fqn || isExternal(n.node) || !s.fqn.startsWith(fqn)) continue
    if (s.fqn.length > fqn.length && !SEP.test(s.fqn.slice(fqn.length))) continue
    if (!best || fqn.length > best.node.fqn.length) best = n
  }
  return best?.id ?? null
}

// Found symbols → how many fall in each drawn box.
export const highlightCounts = (nodes: readonly ProjectNode[], found: readonly Pick<CodeSymbol, 'id' | 'fqn'>[]) => {
  const out = new Map<string, number>()
  for (const s of found) {
    const id = nodeForSymbol(nodes, s)
    if (id) out.set(id, (out.get(id) ?? 0) + 1)
  }
  return out
}
