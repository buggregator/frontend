import Dagre from '@dagrejs/dagre'
import type { SentryServiceMap, SentryServiceMapEdge, SentryServiceMapTrace } from '../../types'

// Service map over a period (#6533 B, V1 from #6540): geometry and numbers.
// Pure: the component draws what this returns, the particles read `samples`.

export type Pt = { x: number; y: number }

export const NODE_W = 210
export const NODE_H = 104
// Room on the left for the «clients · N in» band into an entry service.
export const ENTRY_W = 128
const LABEL_W = 96
const LABEL_H = 50
const PAD = 32
// A line with this error share turns red (V1 rule, #6531).
export const ERROR_LINE = 0.05
// «most errors» needs this many calls: 1 failure of 2 is no hot spot.
export const HOT_MIN_CALLS = 20
export const SAMPLES = 64

export type MapNode = {
  id: string
  label: string
  external: boolean
  // External hosts: what they are, from the calls into them.
  kind: 'service' | 'database' | 'external'
  x: number
  y: number
  w: number
  h: number
  inCount: number
  outCount: number
  rpm: number
  errorCount: number
  errorRate: number
  p95: number | null
  // in / the largest in on the map, for the volume bar.
  volume: number
  hot: boolean
}

export type MapEdge = {
  id: string
  source: string
  target: string
  opType: string
  count: number
  errors: number
  errorRate: number
  p95: number | null
  // Share of the caller's outgoing calls.
  share: number
  isErr: boolean
  band: number
  // Particles per second and seconds along the line.
  emission: number
  travel: number
  d: string
  samples: Pt[]
  label: Pt
  traceCount: number
  traces: SentryServiceMapTrace[]
}

export type MapEntry = {
  id: string
  nodeId: string
  count: number
  band: number
  d: string
  samples: Pt[]
  label: Pt
  emission: number
  travel: number
  errorRate: number
}

export type HotSpotKind = 'busiest' | 'errors' | 'slowest'
export type HotSpot = { kind: HotSpotKind; edgeId: string }

export type ServiceMapModel = {
  width: number
  height: number
  periodSeconds: number
  nodes: MapNode[]
  edges: MapEdge[]
  entries: MapEntry[]
  hotSpots: HotSpot[]
}

export const edgeId = (e: Pick<SentryServiceMapEdge, 'source' | 'target' | 'op_type'>) =>
  `${e.source}→${e.target}${e.op_type ? `:${e.op_type}` : ''}`

const rate = (errors: number, count: number) => (count > 0 ? errors / count : 0)

// Seconds the data covers: the server's from/to, else its window.
export const periodSeconds = (data: SentryServiceMap): number => {
  const from = data.from ? Date.parse(data.from) : NaN
  const to = data.to ? Date.parse(data.to) : NaN
  if (Number.isFinite(from) && Number.isFinite(to) && to > from) return (to - from) / 1000
  return Math.max(60, (data.window_minutes || 60) * 60)
}

// #6540 particle rules: density by requests per second, speed by p95.
export const emissionRate = (count: number, seconds: number) =>
  count > 0 ? Math.max(1.2, Math.min((count / Math.max(1, seconds)) * 24, 80)) : 0
export const travelSeconds = (p95: number | null | undefined) => 1 + Math.min(3, Math.max(0, p95 ?? 0) / 600)
export const bandWidth = (count: number, max: number) =>
  1.5 + 4.5 * Math.sqrt(max > 0 ? Math.min(1, count / max) : 0) + 6

const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y)

// A smooth line through the points (Catmull-Rom), as a dense polyline.
export const smooth = (pts: Pt[], steps = 10): Pt[] => {
  if (pts.length < 3) return pts
  const out: Pt[] = [pts[0]]
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    for (let s = 1; s <= steps; s++) {
      const t = s / steps
      const t2 = t * t
      const t3 = t2 * t
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
      out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) })
    }
  }
  return out
}

// `n` points evenly spaced along the polyline: the particles' lookup table.
export const resample = (line: Pt[], n = SAMPLES): Pt[] => {
  if (line.length === 0) return []
  if (line.length === 1) return Array.from({ length: n }, () => ({ ...line[0] }))
  const acc = [0]
  for (let i = 1; i < line.length; i++) acc.push(acc[i - 1] + dist(line[i - 1], line[i]))
  const total = acc[acc.length - 1]
  const out: Pt[] = []
  let j = 1
  for (let k = 0; k < n; k++) {
    const want = (total * k) / (n - 1)
    while (j < line.length - 1 && acc[j] < want) j++
    const seg = acc[j] - acc[j - 1] || 1
    const t = Math.min(1, Math.max(0, (want - acc[j - 1]) / seg))
    out.push({ x: line[j - 1].x + (line[j].x - line[j - 1].x) * t, y: line[j - 1].y + (line[j].y - line[j - 1].y) * t })
  }
  return out
}

const toD = (line: Pt[]) => line.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

export const buildServiceMap = (data: SentryServiceMap): ServiceMapModel => {
  const seconds = periodSeconds(data)
  const g = new Dagre.graphlib.Graph({ multigraph: true })
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 48, ranksep: 160, marginx: 0, marginy: 0 })

  const known = new Set(data.nodes.map((n) => n.id))
  // An edge may name a node the server did not list: draw it as external.
  const nodesIn = [...data.nodes]
  for (const e of data.edges) {
    for (const id of [e.source, e.target]) {
      if (!known.has(id)) {
        known.add(id)
        nodesIn.push({ id, label: id, kind: 'external', request_count: 0, error_count: 0, avg_duration_ms: null })
      }
    }
  }
  for (const n of nodesIn) g.setNode(n.id, { width: NODE_W, height: NODE_H })
  const edgesIn = data.edges.filter((e) => e.source !== e.target)
  for (const e of edgesIn) g.setEdge(e.source, e.target, { width: LABEL_W, height: LABEL_H, labelpos: 'c' }, edgeId(e))
  Dagre.layout(g)

  const outCount = new Map<string, number>()
  const inFromEdges = new Map<string, number>()
  const firstOp = new Map<string, string>()
  for (const e of edgesIn) {
    outCount.set(e.source, (outCount.get(e.source) ?? 0) + e.request_count)
    inFromEdges.set(e.target, (inFromEdges.get(e.target) ?? 0) + e.request_count)
    if (!firstOp.has(e.target)) firstOp.set(e.target, e.op_type)
  }

  // Entry services: they served requests nobody on the map sent them.
  const isEntry = (n: (typeof nodesIn)[number]) =>
    n.kind !== 'external' && n.request_count > 0 && !inFromEdges.has(n.id)
  const hasEntry = nodesIn.some(isEntry)
  const shiftX = PAD + (hasEntry ? ENTRY_W : 0)
  // Room above for the service picker.
  const shiftY = PAD + 40

  const inOf = (n: (typeof nodesIn)[number]) => Math.max(n.request_count, inFromEdges.get(n.id) ?? 0)
  const maxIn = Math.max(1, ...nodesIn.map(inOf))

  const nodes: MapNode[] = nodesIn.map((n) => {
    const p = g.node(n.id)
    const external = n.kind === 'external'
    const count = inOf(n)
    const errorRate = n.error_rate ?? rate(n.error_count, n.request_count)
    return {
      id: n.id,
      label: n.label || n.id,
      external,
      kind: external ? (firstOp.get(n.id) === 'db' ? 'database' : 'external') : 'service',
      x: p.x - NODE_W / 2 + shiftX,
      y: p.y - NODE_H / 2 + shiftY,
      w: NODE_W,
      h: NODE_H,
      inCount: count,
      outCount: outCount.get(n.id) ?? 0,
      rpm: n.rpm ?? count / (seconds / 60),
      errorCount: n.error_count,
      errorRate,
      p95: n.p95_duration_ms ?? null,
      volume: count / maxIn,
      hot: errorRate >= ERROR_LINE
    }
  })
  const byId = new Map(nodes.map((n) => [n.id, n]))

  const maxEdge = Math.max(1, ...edgesIn.map((e) => e.request_count), ...nodes.filter((n) => isEntry(nodesIn.find((x) => x.id === n.id)!)).map((n) => n.inCount))

  const edges: MapEdge[] = edgesIn.map((e) => {
    const id = edgeId(e)
    const s = byId.get(e.source)!
    const t = byId.get(e.target)!
    const de = g.edge({ v: e.source, w: e.target, name: id }) as { points?: Pt[]; x?: number; y?: number }
    const start = { x: s.x + s.w, y: s.y + s.h / 2 }
    const end = { x: t.x - 2, y: t.y + t.h / 2 }
    const inner = (de.points ?? []).slice(1, -1).map((p) => ({ x: p.x + shiftX, y: p.y + shiftY }))
    const line = smooth([start, ...inner, end])
    const errorRate = e.error_rate ?? rate(e.error_count, e.request_count)
    const label = de.x !== undefined && de.y !== undefined ? { x: de.x + shiftX, y: de.y + shiftY } : line[Math.floor(line.length / 2)]
    return {
      id,
      source: e.source,
      target: e.target,
      opType: e.op_type,
      count: e.request_count,
      errors: e.error_count,
      errorRate,
      p95: e.p95_duration_ms ?? null,
      share: rate(e.request_count, s.outCount),
      isErr: errorRate >= ERROR_LINE,
      band: bandWidth(e.request_count, maxEdge),
      emission: emissionRate(e.request_count, seconds),
      travel: travelSeconds(e.p95_duration_ms),
      d: toD(line),
      samples: resample(line),
      label,
      traceCount: e.trace_count ?? e.traces?.length ?? 0,
      traces: e.traces ?? []
    }
  })

  const entries: MapEntry[] = nodes
    .filter((n) => isEntry(nodesIn.find((x) => x.id === n.id)!))
    .map((n) => {
      const y = n.y + n.h / 2
      const line = [{ x: PAD, y }, { x: n.x - 2, y }]
      return {
        id: `entry→${n.id}`,
        nodeId: n.id,
        count: n.inCount,
        band: bandWidth(n.inCount, maxEdge),
        d: toD(line),
        samples: resample(line),
        label: { x: PAD, y: y - 14 },
        emission: emissionRate(n.inCount, seconds),
        travel: travelSeconds(n.p95),
        errorRate: n.errorRate
      }
    })

  const gr = g.graph() as { width?: number; height?: number }
  return {
    width: Math.ceil((gr.width ?? 0) + shiftX + PAD),
    height: Math.ceil((gr.height ?? 0) + shiftY + PAD),
    periodSeconds: seconds,
    nodes,
    edges,
    entries,
    hotSpots: hotSpots(edges, entries)
  }
}

const top = <T>(list: T[], score: (x: T) => number): T | undefined =>
  list.reduce<T | undefined>((best, x) => (best === undefined || score(x) > score(best) ? x : best), undefined)

// #6540: busiest = the entry service's biggest outgoing line; most errors =
// the highest error share over at least 20 calls; slowest = the highest p95.
export const hotSpots = (edges: MapEdge[], entries: MapEntry[] = []): HotSpot[] => {
  const out: HotSpot[] = []
  const entryIds = new Set(entries.map((e) => e.nodeId))
  const fromEntry = edges.filter((e) => entryIds.has(e.source))
  const busiest = top(fromEntry.length ? fromEntry : edges, (e) => e.count)
  if (busiest && busiest.count > 0) out.push({ kind: 'busiest', edgeId: busiest.id })
  const errors = top(edges.filter((e) => e.count >= HOT_MIN_CALLS && e.errors > 0), (e) => e.errorRate)
  if (errors) out.push({ kind: 'errors', edgeId: errors.id })
  const slowest = top(edges.filter((e) => (e.p95 ?? 0) > 0), (e) => e.p95 ?? 0)
  if (slowest) out.push({ kind: 'slowest', edgeId: slowest.id })
  return out
}

export type MapSelection = { kind: 'node' | 'edge'; id: string } | null

// What stays lit for a selection: a service with its callers, callees and
// their lines; a line with its two ends.
export const litPart = (model: ServiceMapModel, sel: MapSelection): { nodes: Set<string>; edges: Set<string> } | null => {
  if (!sel) return null
  const nodes = new Set<string>()
  const edges = new Set<string>()
  if (sel.kind === 'edge') {
    const e = model.edges.find((x) => x.id === sel.id)
    if (!e) return null
    edges.add(e.id)
    nodes.add(e.source).add(e.target)
    return { nodes, edges }
  }
  if (!model.nodes.some((n) => n.id === sel.id)) return null
  nodes.add(sel.id)
  for (const e of model.edges) {
    if (e.source === sel.id || e.target === sel.id) {
      edges.add(e.id)
      nodes.add(e.source).add(e.target)
    }
  }
  for (const en of model.entries) if (en.nodeId === sel.id) edges.add(en.id)
  return { nodes, edges }
}

export type CallRow = { edgeId: string; service: string; count: number; errors: number; errorRate: number; p95: number | null }

// The drawer's «Uses» (calls it makes) and «Used» (who calls it), as Zipkin.
export const serviceCalls = (model: ServiceMapModel, id: string) => {
  const row = (e: MapEdge, other: string): CallRow => ({
    edgeId: e.id,
    service: other,
    count: e.count,
    errors: e.errors,
    errorRate: e.errorRate,
    p95: e.p95
  })
  const byCount = (a: CallRow, b: CallRow) => b.count - a.count || a.service.localeCompare(b.service)
  const uses = model.edges.filter((e) => e.source === id).map((e) => row(e, e.target)).sort(byCount)
  const used = model.edges.filter((e) => e.target === id).map((e) => row(e, e.source)).sort(byCount)
  const entry = model.entries.find((e) => e.nodeId === id)
  return { uses, used, entryCount: entry?.count ?? 0 }
}

// The box around a part of the map, for panning it into view.
export const boundsOf = (model: ServiceMapModel, ids: Iterable<string>) => {
  const list = [...ids].map((id) => model.nodes.find((n) => n.id === id)).filter((n): n is MapNode => !!n)
  if (!list.length) return null
  const x = Math.min(...list.map((n) => n.x))
  const y = Math.min(...list.map((n) => n.y))
  return {
    x,
    y,
    w: Math.max(...list.map((n) => n.x + n.w)) - x,
    h: Math.max(...list.map((n) => n.y + n.h)) - y
  }
}

// «1.9 s», «380 ms».
export const formatMs = (ms: number | null | undefined) =>
  ms == null ? '—' : ms >= 1000 ? `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)} s` : `${Math.round(ms)} ms`

export const formatPercent = (share: number) => {
  const p = share * 100
  if (p > 0 && p < 1) return `${p.toFixed(1)}%`
  return `${Math.round(p)}%`
}

export const formatRpm = (rpm: number) => (rpm >= 10 || rpm === 0 ? String(Math.round(rpm)) : rpm.toFixed(1))
