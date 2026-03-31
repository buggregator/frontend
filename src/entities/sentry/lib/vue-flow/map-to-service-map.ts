import Dagre from '@dagrejs/dagre'
import type { Node, Edge } from '@vue-flow/core'
import type { SentryServiceMap } from '../../types'

export type ServiceNodeData = {
  label: string
  errorRate: number
  avgDurationMs: number | null
  requestCount: number
}

function errorRateColor(rate: number): string {
  if (rate <= 0) return '#22c55e'     // green
  if (rate < 0.05) return '#f59e0b'   // amber
  return '#ef4444'                     // red
}

export function mapToServiceMap(data: SentryServiceMap): { nodes: Node[], edges: Edge[] } {
  const g = new Dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 60, edgesep: 20, ranksep: 120 })

  const nodes: Node[] = data.nodes.map(n => {
    const errorRate = n.request_count > 0 ? n.error_count / n.request_count : 0
    g.setNode(n.id, { width: 160, height: 60 })

    return {
      id: n.id,
      type: 'serviceNode',
      position: { x: 0, y: 0 },
      data: {
        label: n.label,
        errorRate,
        avgDurationMs: n.avg_duration_ms,
        requestCount: n.request_count,
      } as ServiceNodeData,
    }
  })

  const edges: Edge[] = data.edges.map(e => {
    const errorRate = e.request_count > 0 ? e.error_count / e.request_count : 0
    g.setEdge(e.source, e.target)

    return {
      id: `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      animated: true,
      label: `${e.request_count} req`,
      data: { opType: e.op_type, errorRate },
      style: {
        stroke: errorRateColor(errorRate),
        strokeWidth: Math.max(1.5, Math.min(5, Math.log10(e.request_count + 1) * 1.5)),
      },
    }
  })

  // Apply dagre layout.
  Dagre.layout(g)

  for (const node of nodes) {
    const pos = g.node(node.id)
    if (pos) {
      node.position = { x: pos.x - 80, y: pos.y - 30 }
    }
  }

  return { nodes, edges }
}
