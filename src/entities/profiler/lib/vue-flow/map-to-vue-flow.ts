import Dagre from '@dagrejs/dagre'
import type { Node, Edge } from '@vue-flow/core'
import { MarkerType } from '@vue-flow/core'
import type { ProfilerCallGraph } from '../../types'

export type CallGraphNodeData = {
  name: string
  color: string
  textColor: string
  cost: Record<string, number>
  metrics: { cost: number; percents: number }
  scale: number
}

export type CallGraphNode = Node<CallGraphNodeData>

export type CallGraphEdge = Edge<{
  label: string
  color: string
}>

const MIN_NODE_WIDTH = 140
const MAX_NODE_WIDTH = 260
const MIN_NODE_HEIGHT = 40
const MAX_NODE_HEIGHT = 70

/** Edge type of a function calling itself, drawn as a loop. */
export const SELF_LOOP_EDGE = 'selfLoop'

/** How far the curve of a loop is pulled out of the right side of the node. */
const LOOP_PULL = 70

/** How far a loop takes room beside the node: the curve reaches out 3/4 of its pull. */
const LOOP_ROOM = 70

/**
 * A loop out of the right side of a node and back into it, a little lower, with the label inside it: past the loop
 * it would leave the view, which is fitted to the nodes only.
 *
 * @param x The right side of the node.
 * @param y The middle of the node's height.
 */
export function selfLoopPath(x: number, y: number): EdgePath {
  return {
    path: `M ${x} ${y - 8} C ${x + LOOP_PULL} ${y - 45}, ${x + LOOP_PULL} ${y + 45}, ${x} ${y + 8}`,
    labelX: x + LOOP_PULL * 0.4,
    labelY: y,
  }
}

/** Edge type of a call back up the graph, to a caller of the caller in a cycle, drawn beside the nodes. */
export const BACK_EDGE = 'backEdge'

/** How far the curve of a call back up is pulled out of the right sides of its nodes. */
const BACK_PULL = 60

export type EdgePath = { path: string; labelX: number; labelY: number }

type Box = { x: number; y: number; width: number; height: number }

/**
 * A curve from the top of a node, off its middle where the calls down come in, up to the right side of a node above
 * it. Joining the bottom of the node to the top of the other, as the calls down do, it would run across both nodes
 * and over the call down between them; out of the side, across the nodes beside it.
 */
export function backEdgePath(from: Box, to: Box): EdgePath {
  const points = [
    [from.x + from.width * 0.8, from.y],
    [from.x + from.width * 0.8, from.y - BACK_PULL],
    [to.x + to.width + BACK_PULL, to.y + to.height / 2],
    [to.x + to.width, to.y + to.height / 2],
  ]
  // The middle of the curve: (P0 + 3 P1 + 3 P2 + P3) / 8
  const middle = (axis: 0 | 1) => (points[0][axis] + 3 * points[1][axis] + 3 * points[2][axis] + points[3][axis]) / 8
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = points

  return {
    path: `M ${x0} ${y0} C ${x1} ${y1}, ${x2} ${y2}, ${x3} ${y3}`,
    labelX: middle(0),
    labelY: middle(1),
  }
}

export function mapToVueFlow(serverData: ProfilerCallGraph): {
  nodes: CallGraphNode[]
  edges: CallGraphEdge[]
} {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 30, edgesep: 10, ranksep: 80 })

  const looped = new Set(
    (serverData.edges || [])
      .map((e) => e.data as Record<string, unknown>)
      .filter((d) => d.source === d.target)
      .map((d) => String(d.source)),
  )
  const widths = new Map<string, number>()

  const nodes: CallGraphNode[] = (serverData.nodes || []).map((n) => {
    const d = n.data as Record<string, unknown>
    const id = String(d.id)
    const metrics = (d.metrics || { cost: 0, percents: 0 }) as { cost: number; percents: number }

    const scale = Math.max(0.15, Math.min(1, metrics.percents / 100))
    const nodeWidth = MIN_NODE_WIDTH + (MAX_NODE_WIDTH - MIN_NODE_WIDTH) * scale
    const nodeHeight = MIN_NODE_HEIGHT + (MAX_NODE_HEIGHT - MIN_NODE_HEIGHT) * scale

    // Room for a loop on both sides keeps the center of the node where Dagre puts it
    widths.set(id, nodeWidth)
    g.setNode(id, { width: nodeWidth + (looped.has(id) ? 2 * LOOP_ROOM : 0), height: nodeHeight })

    return {
      id,
      position: { x: 0, y: 0 },
      type: 'callGraphNode',
      data: {
        name: String(d.name || ''),
        color: String(d.color || '#ffffff'),
        textColor: String(d.textColor || '#000000'),
        cost: (d.cost || {}) as Record<string, number>,
        metrics,
        scale,
      },
    }
  })

  const edges: CallGraphEdge[] = (serverData.edges || []).map((e) => {
    const d = e.data as Record<string, unknown>
    const source = String(d.source || e.data?.source)
    const target = String(d.target || e.data?.target)

    g.setEdge(source, target)

    return {
      id: `e-${source}-${target}`,
      source,
      target,
      ...(source === target ? { type: SELF_LOOP_EDGE } : {}),
      data: {
        label: String(d.label || ''),
        color: String(d.color || '#666'),
      },
      style: { stroke: String(d.color || '#666') },
      markerEnd: { type: MarkerType.ArrowClosed, color: String(d.color || '#666'), width: 5, height: 5 },
      label: String(d.label || ''),
      // The label of a loop is placed inside it, see selfLoopPath()
      labelStyle: { fontSize: '8px', fill: '#999', ...(source === target ? {} : { transform: 'translateX(20px)' }) },
      labelBgStyle: { fill: 'transparent' },
      labelBgPadding: [4, 2] as [number, number],
    }
  })

  Dagre.layout(g)

  for (const node of nodes) {
    const pos = g.node(node.id)
    if (pos) {
      node.position = { x: pos.x - (widths.get(node.id) ?? pos.width) / 2, y: pos.y - pos.height / 2 }
    }
  }

  // A cycle has a call back up the graph: Dagre breaks it, and places its target above its source
  const top = new Map(nodes.map((n) => [n.id, n.position.y]))
  for (const edge of edges) {
    if (edge.source !== edge.target && (top.get(edge.target) ?? 0) < (top.get(edge.source) ?? 0)) {
      edge.type = BACK_EDGE
      edge.labelStyle = { fontSize: '8px', fill: '#999' }
    }
  }

  return { nodes, edges }
}
