import Dagre from '@dagrejs/dagre'
import type { Node, Edge } from '@vue-flow/core'
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

export function mapToVueFlow(serverData: ProfilerCallGraph): {
  nodes: CallGraphNode[]
  edges: CallGraphEdge[]
} {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 30, edgesep: 10, ranksep: 80 })

  const nodes: CallGraphNode[] = (serverData.nodes || []).map((n) => {
    const d = n.data as Record<string, unknown>
    const id = String(d.id)
    const metrics = (d.metrics || { cost: 0, percents: 0 }) as { cost: number; percents: number }

    const scale = Math.max(0.15, Math.min(1, metrics.percents / 100))
    const nodeWidth = MIN_NODE_WIDTH + (MAX_NODE_WIDTH - MIN_NODE_WIDTH) * scale
    const nodeHeight = MIN_NODE_HEIGHT + (MAX_NODE_HEIGHT - MIN_NODE_HEIGHT) * scale

    g.setNode(id, { width: nodeWidth, height: nodeHeight })

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
      data: {
        label: String(d.label || ''),
        color: String(d.color || '#666'),
      },
      style: { stroke: String(d.color || '#666') },
      markerEnd: { type: 'arrowclosed' as const, color: String(d.color || '#666'), width: 5, height: 5 },
      label: String(d.label || ''),
      labelStyle: { fontSize: '8px', fill: '#999', transform: 'translateX(20px)' },
      labelBgStyle: { fill: 'transparent' },
      labelBgPadding: [4, 2] as [number, number],
    }
  })

  Dagre.layout(g)

  for (const node of nodes) {
    const pos = g.node(node.id)
    if (pos) {
      node.position = { x: pos.x - pos.width / 2, y: pos.y - pos.height / 2 }
    }
  }

  return { nodes, edges }
}
