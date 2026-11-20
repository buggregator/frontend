import type { Edge, Node } from '@vue-flow/core'
import type { SentrySpan } from '../../types'
import { SOURCE_LABEL } from '../otel'
import { buildSpanTree, selfTimes, serviceColors, UNKNOWN_SERVICE, type SpanTreeNode } from '../trace-graph/trace-graph'

// One trace as a call graph (#6533 A, readability spec #6531): a node per span,
// a column group per service. A call inside a service goes one row down, a call
// into another service goes right on the same row; an outgoing HTTP call with no
// service behind it ends in an external host node under its caller.

export type ServiceCluster = {
  service: string
  source: string | null
  color: string
  x: number
  y: number
  width: number
  height: number
}

export type TraceSpanNodeData = {
  spanId: string
  title: string
  service: string
  op: string
  totalMs: number
  selfMs: number
  isError: boolean
}

export type TraceExternalNodeData = { host: string }

export type TraceCallEdgeData = {
  // Crosses into another service (or an external host): labelled.
  crosses: boolean
  failed: boolean
  label: string | null
  // Where the label sits: above a horizontal edge, right of a vertical one.
  labelSide: 'above' | 'right'
}

export const NODE_W = 184
export const NODE_H = 64
const SUB_GAP = 24
const PAD = 16
const PAD_TOP = 36
const CLUSTER_GAP = 104
const ROW = 104

const serviceOf = (s: SentrySpan): string => s.service_name || UNKNOWN_SERVICE
const ms = (n: number) => `${Math.round(n)} ms`

const isExternalCall = (n: SpanTreeNode) =>
  !!n.span.peer_address &&
  !n.children.length &&
  (n.span.peer_type === 'http' || n.span.op.startsWith('http.client'))

const hostOf = (address: string): string => {
  try {
    return new URL(address.includes('://') ? address : `http://${address}`).host || address
  } catch {
    return address
  }
}

export const mapToTraceCallGraph = (
  spans: SentrySpan[]
): { nodes: Node[]; edges: Edge[]; clusters: ServiceCluster[] } => {
  if (!spans.length) return { nodes: [], edges: [], clusters: [] }

  const colors = serviceColors(spans)
  const self = selfTimes(spans)
  const roots = buildSpanTree(spans)

  // 1–3: services in depth-first order, a row and a sub-column per span.
  const services: string[] = []
  const rowOf = new Map<string, number>()
  const subOf = new Map<string, number>()
  const used = new Map<string, number>() // `${service}:${row}` → next sub-column
  const externals: { id: string; caller: SentrySpan; host: string }[] = []

  const place = (n: SpanTreeNode, row: number) => {
    const service = serviceOf(n.span)
    if (!services.includes(service)) services.push(service)
    const key = `${service}:${row}`
    const sub = used.get(key) ?? 0
    used.set(key, sub + 1)
    rowOf.set(n.span.span_id, row)
    subOf.set(n.span.span_id, sub)
    for (const c of n.children) place(c, serviceOf(c.span) === service ? row + 1 : row)
    if (isExternalCall(n)) externals.push({ id: `ext:${n.span.span_id}`, caller: n.span, host: hostOf(n.span.peer_address!) })
  }
  let nextRow = 0
  for (const r of roots) {
    place(r, nextRow)
    nextRow = Math.max(...rowOf.values()) + 1
  }

  // 4: cluster boxes, left to right.
  const clusters: ServiceCluster[] = []
  const clusterX = new Map<string, number>()
  let x = 0
  for (const service of services) {
    const ids = spans.filter((s) => serviceOf(s) === service).map((s) => s.span_id)
    const rows = ids.map((id) => rowOf.get(id)!)
    const subs = Math.max(...ids.map((id) => subOf.get(id)!)) + 1
    const width = PAD * 2 + subs * NODE_W + (subs - 1) * SUB_GAP
    const minRow = Math.min(...rows)
    const maxRow = Math.max(...rows)
    const first = spans.find((s) => serviceOf(s) === service)
    clusters.push({
      service,
      source: first?.source ? SOURCE_LABEL[first.source] : null,
      color: colors.get(service)!,
      x,
      y: minRow * ROW,
      width,
      height: PAD_TOP + (maxRow - minRow) * ROW + NODE_H + PAD
    })
    clusterX.set(service, x)
    x += width + CLUSTER_GAP
  }

  const posOf = (s: SentrySpan) => ({
    x: clusterX.get(serviceOf(s))! + PAD + subOf.get(s.span_id)! * (NODE_W + SUB_GAP),
    y: rowOf.get(s.span_id)! * ROW + PAD_TOP
  })

  const nodes: Node[] = spans.map((s) => ({
    id: s.span_id,
    type: 'traceSpan',
    position: posOf(s),
    width: NODE_W,
    height: NODE_H,
    ariaLabel: `${s.description || s.op}, ${serviceOf(s)}, ${ms(s.duration_ms)}${s.is_error ? ', error' : ''}`,
    data: {
      spanId: s.span_id,
      title: s.description || s.op,
      service: serviceOf(s),
      op: s.op,
      totalMs: s.duration_ms,
      selfMs: self.get(s.span_id) ?? 0,
      isError: s.is_error
    } as TraceSpanNodeData
  }))

  const byId = new Map(spans.map((s) => [s.span_id, s]))
  const edges: Edge[] = []
  for (const s of spans) {
    const parent = s.parent_span_id ? byId.get(s.parent_span_id) : undefined
    if (!parent || parent === s) continue
    const crosses = serviceOf(parent) !== serviceOf(s)
    // Red only for a failed call into another service (#6531).
    const failed = crosses && parent.is_error
    edges.push({
      id: `${parent.span_id}->${s.span_id}`,
      source: parent.span_id,
      target: s.span_id,
      type: 'traceCall',
      sourceHandle: crosses ? 'r' : 'b',
      targetHandle: crosses ? 'l' : 't',
      data: {
        crosses,
        failed,
        label: crosses ? `${ms(parent.duration_ms)}${failed ? ' · error' : ''}` : null,
        labelSide: 'above'
      } as TraceCallEdgeData
    })
  }

  for (const e of externals) {
    const p = posOf(e.caller)
    nodes.push({
      id: e.id,
      type: 'traceExternal',
      position: { x: p.x, y: p.y + ROW + PAD },
      width: NODE_W,
      height: NODE_H,
      ariaLabel: `${e.host}, external host, no SDK`,
      data: { host: e.host } as TraceExternalNodeData
    })
    edges.push({
      id: `${e.caller.span_id}->${e.id}`,
      source: e.caller.span_id,
      target: e.id,
      type: 'traceCall',
      sourceHandle: 'b',
      targetHandle: 't',
      data: {
        crosses: true,
        failed: e.caller.is_error,
        label: `${ms(e.caller.duration_ms)}${e.caller.is_error ? ' · error' : ''}`,
        labelSide: 'right'
      } as TraceCallEdgeData
    })
  }

  return { nodes, edges, clusters }
}

// The path through a node (#6531 highlight): its callers up to the root and
// everything it calls.
export const pathThrough = (nodeId: string, edges: Edge[]): { nodes: Set<string>; edges: Set<string> } => {
  const nodes = new Set([nodeId])
  const onPath = new Set<string>()
  const up = (id: string) => {
    for (const e of edges) {
      if (e.target !== id) continue
      onPath.add(e.id)
      if (!nodes.has(e.source)) {
        nodes.add(e.source)
        up(e.source)
      }
    }
  }
  const down = (id: string) => {
    for (const e of edges) {
      if (e.source === id) {
        onPath.add(e.id)
        if (!nodes.has(e.target)) {
          nodes.add(e.target)
          down(e.target)
        }
      }
    }
  }
  up(nodeId)
  down(nodeId)
  return { nodes, edges: onPath }
}
