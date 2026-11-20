import type { FlameChartNode } from 'flame-chart-js'
import type { SentrySpan } from '../../types'

// One trace as graphs (#6533 view A): the span tree, where the time went,
// flame-chart nodes and the «kept working after its caller gave up» insight.

export type SpanTreeNode = { span: SentrySpan; children: SpanTreeNode[] }

export type TimeRow = { name: string; ms: number; percent: number }
export type OperationRow = TimeRow & { spanId: string; service: string }

export type TraceInsight = {
  service: string
  caller: string
  overrunMs: number
  callerWaitedMs: number
  callerFailed: boolean
  calleeMs: number
  spanId: string
  callerSpanId: string
}

export const UNKNOWN_SERVICE = 'unknown'

// Tailwind 400 shades: distinct in dark and light, none of them red (red marks
// errors), and each ≥ 7:1 with the dark bar text (#111827) of the flame graph.
const PALETTE = ['#a78bfa', '#22d3ee', '#fb923c', '#34d399', '#f472b6', '#facc15', '#60a5fa', '#a3e635']

const serviceOf = (s: SentrySpan): string => s.service_name || UNKNOWN_SERVICE
const endOf = (s: SentrySpan): number => s.start_offset_ms + s.duration_ms
const round = (n: number): number => Math.round(n * 10) / 10

const byStart = (a: SpanTreeNode, b: SpanTreeNode) => a.span.start_offset_ms - b.span.start_offset_ms

export const buildSpanTree = (spans: SentrySpan[]): SpanTreeNode[] => {
  const nodes = new Map(spans.map((s) => [s.span_id, { span: s, children: [] } as SpanTreeNode]))
  const roots: SpanTreeNode[] = []
  for (const node of nodes.values()) {
    const parent = node.span.parent_span_id ? nodes.get(node.span.parent_span_id) : undefined
    if (parent && parent !== node) parent.children.push(node)
    else roots.push(node)
  }
  for (const node of nodes.values()) node.children.sort(byStart)
  return roots.sort(byStart)
}

const parentMap = (spans: SentrySpan[]): Map<string, SentrySpan> => {
  const byId = new Map(spans.map((s) => [s.span_id, s]))
  const parents = new Map<string, SentrySpan>()
  for (const s of spans) {
    const p = s.parent_span_id ? byId.get(s.parent_span_id) : undefined
    if (p && p !== s) parents.set(s.span_id, p)
  }
  return parents
}

// Span duration minus the union of its children's intervals clipped to the span.
export const selfTimes = (spans: SentrySpan[]): Map<string, number> => {
  const result = new Map<string, number>()
  const walk = (node: SpanTreeNode) => {
    const from = node.span.start_offset_ms
    const to = endOf(node.span)
    const intervals = node.children
      .map((c) => [Math.max(from, c.span.start_offset_ms), Math.min(to, endOf(c.span))])
      .filter(([a, b]) => b > a)
      .sort((x, y) => x[0] - y[0])
    let covered = 0
    let curA = -Infinity
    let curB = -Infinity
    for (const [a, b] of intervals) {
      if (a > curB) {
        if (curB > curA) covered += curB - curA
        curA = a
        curB = b
      } else curB = Math.max(curB, b)
    }
    if (curB > curA) covered += curB - curA
    result.set(node.span.span_id, round(Math.max(0, node.span.duration_ms - covered)))
    node.children.forEach(walk)
  }
  buildSpanTree(spans).forEach(walk)
  return result
}

const withPercents = <T extends { ms: number }>(rows: T[]): (T & { percent: number })[] => {
  const total = rows.reduce((a, r) => a + r.ms, 0)
  return rows.map((r) => ({ ...r, percent: total > 0 ? round((r.ms / total) * 100) : 0 }))
}

export const timeByService = (spans: SentrySpan[]): TimeRow[] => {
  const self = selfTimes(spans)
  const sums = new Map<string, number>()
  for (const s of spans) sums.set(serviceOf(s), (sums.get(serviceOf(s)) ?? 0) + (self.get(s.span_id) ?? 0))
  const rows = [...sums.entries()].map(([name, ms]) => ({ name, ms: round(ms) }))
  return withPercents(rows).sort((a, b) => b.ms - a.ms)
}

export const timeByOperation = (spans: SentrySpan[], limit = 8): OperationRow[] => {
  const self = selfTimes(spans)
  const rows = spans.map((s) => ({
    name: s.description || s.op,
    ms: self.get(s.span_id) ?? 0,
    spanId: s.span_id,
    service: serviceOf(s)
  }))
  return withPercents(rows)
    .sort((a, b) => b.ms - a.ms)
    .slice(0, limit)
}

// A colour per name, in the order given (the flow view's lanes, #6533 C).
export const paletteColors = (names: string[]): Map<string, string> => {
  const colors = new Map<string, string>()
  for (const name of names) if (!colors.has(name)) colors.set(name, PALETTE[colors.size % PALETTE.length])
  return colors
}

export const serviceColors = (spans: SentrySpan[]): Map<string, string> =>
  paletteColors([...spans].sort((a, b) => a.start_offset_ms - b.start_offset_ms).map(serviceOf))

export const ERROR_BADGE = '#ef4444'

// `type` keeps the span id: the chart hands it back on select.
export const toFlameNodes = (spans: SentrySpan[], colors: Map<string, string>): FlameChartNode[] => {
  const toNode = (n: SpanTreeNode): FlameChartNode => ({
    name: `${n.span.description || n.span.op} ${Math.round(n.span.duration_ms)} ms`,
    start: n.span.start_offset_ms,
    duration: n.span.duration_ms,
    type: n.span.span_id,
    color: colors.get(serviceOf(n.span)),
    ...(n.span.is_error ? { badge: ERROR_BADGE } : {}),
    ...(n.children.length ? { children: n.children.map(toNode) } : {})
  })
  return buildSpanTree(spans).map(toNode)
}

// An overrun worth a line: a few ms past the caller is normal (PHP ends its
// transaction after the response is sent), so at least 50 ms and 10 % of the wait.
export const isNotableOverrun = (overrunMs: number, callerWaitedMs: number) =>
  overrunMs >= Math.max(50, callerWaitedMs * 0.1)

// «gave up» only when the caller failed; otherwise it simply stopped waiting.
export const overrunText = (service: string, caller: string, overrun: string, callerFailed: boolean) =>
  `${service} kept working ${overrun} after ${caller} ${callerFailed ? 'gave up' : 'stopped waiting'}`

// The largest overrun of a span past the end of its caller in another service:
// the callee kept working after the caller stopped waiting.
export const traceInsight = (spans: SentrySpan[]): TraceInsight | null => {
  const parents = parentMap(spans)
  let best: TraceInsight | null = null
  for (const s of spans) {
    const caller = parents.get(s.span_id)
    if (!caller || serviceOf(caller) === serviceOf(s)) continue
    const overrun = round(endOf(s) - endOf(caller))
    if (!isNotableOverrun(overrun, caller.duration_ms) || (best && overrun <= best.overrunMs)) continue
    best = {
      service: serviceOf(s),
      caller: serviceOf(caller),
      overrunMs: overrun,
      callerWaitedMs: caller.duration_ms,
      callerFailed: caller.is_error,
      calleeMs: s.duration_ms,
      spanId: s.span_id,
      callerSpanId: caller.span_id
    }
  }
  return best
}
