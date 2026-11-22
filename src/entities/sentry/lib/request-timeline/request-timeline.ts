import type { SentryNPlusOne, SentrySpan, SentryTraceDetail } from '../../types'
import { spansWithRoot } from '../otel'

// One request on one time scale (#6715, concept 3 of #6689): every span of
// the trace in a lane by its kind, plus events of other modules that carry
// the same trace id (logs, mails, HTTP dumps), placed by their own time.

export type TimelineLane = 'request' | 'db' | 'cache' | 'http' | 'jobs' | 'view' | 'logs' | 'dumps' | 'events' | 'mail' | 'other'

// Top to bottom, as in the concept.
export const LANE_ORDER: TimelineLane[] = ['request', 'db', 'cache', 'logs', 'dumps', 'events', 'http', 'mail', 'jobs', 'view', 'other']

export const LANE_LABEL: Record<TimelineLane, string> = {
  request: 'Request',
  db: 'Queries',
  cache: 'Cache',
  http: 'HTTP out',
  jobs: 'Jobs',
  view: 'Views',
  logs: 'Logs',
  dumps: 'Dumps',
  events: 'Errors',
  mail: 'Mail',
  other: 'Other'
}

// What a row of the list calls one item of the lane.
export const LANE_KIND: Record<TimelineLane, string> = {
  request: 'req',
  db: 'query',
  cache: 'cache',
  http: 'http',
  jobs: 'job',
  view: 'view',
  logs: 'log',
  dumps: 'dump',
  events: 'error',
  mail: 'mail',
  other: 'span'
}

export type MarkerTone = 'error' | 'warning'

// The tone of a Sentry log level (error and fatal, warn and warning).
export const sentryLogTone = (level: string): MarkerTone | undefined => {
  if (level === 'error' || level === 'fatal') return 'error'
  if (level === 'warn' || level === 'warning') return 'warning'
  return undefined
}

// A moment on the scale that is not a span: given by the page, which knows
// the other modules' events. `to` is a router location.
export type TimelineMarker = {
  id: string
  lane: TimelineLane
  // Milliseconds from the start of the request.
  atMs: number
  label: string
  tone?: MarkerTone
  to?: unknown
  // Lines for the details panel.
  details?: string[]
}

export type TimelineSpanItem = {
  kind: 'span'
  id: string
  lane: TimelineLane
  startMs: number
  durationMs: number
  label: string
  isError: boolean
  span: SentrySpan
}

export type TimelineGroupItem = {
  kind: 'group'
  id: string
  lane: TimelineLane
  startMs: number
  // From the first start to the last end.
  durationMs: number
  // Sum of the spans' own time.
  totalMs: number
  count: number
  label: string
  isError: boolean
  nPlusOne: SentryNPlusOne | null
  spans: SentrySpan[]
}

export type TimelineMarkerItem = {
  kind: 'marker'
  id: string
  lane: TimelineLane
  startMs: number
  durationMs: 0
  label: string
  isError: boolean
  marker: TimelineMarker
}

export type TimelineItem = TimelineSpanItem | TimelineGroupItem | TimelineMarkerItem

export type TimelineLaneRow = { lane: TimelineLane; label: string; count: number; items: TimelineItem[] }

export type RequestTimelineModel = {
  totalMs: number
  lanes: TimelineLaneRow[]
  // Every item, by start time: the list under the lanes and the phone view.
  list: TimelineItem[]
}

// Spans of the same lane and text that make one block: fewer are drawn one by one.
export const GROUP_MIN = 5

export const spanLane = (span: SentrySpan): TimelineLane => {
  if (span.is_transaction) return 'request'
  const op = (span.op || '').toLowerCase()
  if (span.peer_type === 'db' || op.startsWith('db')) return 'db'
  if (span.peer_type === 'cache' || op.startsWith('cache')) return 'cache'
  if (span.peer_type === 'queue' || op.startsWith('queue')) return 'jobs'
  if (span.peer_type === 'http' || op.startsWith('http.client')) return 'http'
  if (op.startsWith('mail')) return 'mail'
  if (op.startsWith('view') || op.startsWith('template')) return 'view'
  return 'other'
}

const spanLabel = (span: SentrySpan) => span.description || span.op || span.span_id

const spanItem = (span: SentrySpan): TimelineSpanItem => ({
  kind: 'span',
  id: span.span_id,
  lane: spanLane(span),
  startMs: span.start_offset_ms,
  durationMs: span.duration_ms,
  label: spanLabel(span),
  isError: span.is_error,
  span
})

const groupItem = (lane: TimelineLane, spans: SentrySpan[], label: string, nPlusOne: SentryNPlusOne | null): TimelineGroupItem => {
  const start = Math.min(...spans.map((s) => s.start_offset_ms))
  const end = Math.max(...spans.map((s) => s.start_offset_ms + s.duration_ms))
  return {
    kind: 'group',
    id: `group:${spans[0].span_id}`,
    lane,
    startMs: start,
    durationMs: end - start,
    totalMs: nPlusOne ? nPlusOne.total_ms : spans.reduce((sum, s) => sum + s.duration_ms, 0),
    count: spans.length,
    label,
    isError: spans.some((s) => s.is_error),
    nPlusOne,
    spans: [...spans].sort((a, b) => a.start_offset_ms - b.start_offset_ms)
  }
}

// N+1 groups of the server first, then any other run of GROUP_MIN or more
// spans with the same lane and text (300 cache reads are one block too).
const spanItems = (spans: SentrySpan[], nPlusOne: SentryNPlusOne[]): TimelineItem[] => {
  const byId = new Map(spans.map((s) => [s.span_id, s]))
  const taken = new Set<string>()
  const items: TimelineItem[] = []

  for (const n of nPlusOne) {
    const members = n.span_ids.map((id) => byId.get(id)).filter((s): s is SentrySpan => !!s && !taken.has(s.span_id))
    if (members.length < 2) continue
    members.forEach((s) => taken.add(s.span_id))
    items.push(groupItem('db', members, n.query, n))
  }

  const runs = new Map<string, SentrySpan[]>()
  for (const s of spans) {
    if (taken.has(s.span_id)) continue
    const lane = spanLane(s)
    if (lane === 'request') {
      items.push(spanItem(s))
      continue
    }
    const key = `${lane}\u0000${s.parent_span_id ?? ''}\u0000${spanLabel(s)}`
    runs.set(key, [...(runs.get(key) ?? []), s])
  }
  for (const run of runs.values()) {
    if (run.length >= GROUP_MIN) items.push(groupItem(spanLane(run[0]), run, spanLabel(run[0]), null))
    else items.push(...run.map(spanItem))
  }
  return items
}

const markerItem = (m: TimelineMarker, totalMs: number): TimelineMarkerItem => ({
  kind: 'marker',
  id: `marker:${m.id}`,
  lane: m.lane,
  // Clocks differ (SDK time against our receive time): keep it on the scale.
  startMs: Math.min(Math.max(m.atMs, 0), totalMs),
  durationMs: 0,
  label: m.label,
  isError: m.tone === 'error',
  marker: m
})

const itemCount = (item: TimelineItem) => (item.kind === 'group' ? item.count : 1)

export const buildRequestTimeline = (detail: SentryTraceDetail, markers: TimelineMarker[] = []): RequestTimelineModel => {
  const spans = spansWithRoot(detail)
  const ends = spans.map((s) => s.start_offset_ms + s.duration_ms)
  const totalMs = Math.max(detail.transaction.duration_ms || 0, ...ends, 1)

  const items = [...spanItems(spans, detail.n_plus_one ?? []), ...markers.map((m) => markerItem(m, totalMs))]
  const list = [...items].sort((a, b) => a.startMs - b.startMs || LANE_ORDER.indexOf(a.lane) - LANE_ORDER.indexOf(b.lane))

  const lanes = LANE_ORDER.map((lane) => {
    const laneItems = list.filter((i) => i.lane === lane)
    return { lane, label: LANE_LABEL[lane], count: laneItems.reduce((n, i) => n + itemCount(i), 0), items: laneItems }
  }).filter((row) => row.lane === 'request' || row.count > 0)

  return { totalMs, lanes, list }
}

export type SummaryPart = { lane: TimelineLane; text: string; tone?: MarkerTone }

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const fmtMs = (ms: number) => (ms >= 10 ? `${Math.round(ms)} ms` : `${Math.round(ms * 10) / 10} ms`)

// «34 queries · 151 ms, 3 cache, 1 error, 1 mail»: one part per lane with items.
export const timelineSummary = (timeline: RequestTimelineModel): SummaryPart[] => {
  const count = (lane: TimelineLane) => timeline.lanes.find((l) => l.lane === lane)?.count ?? 0
  const items = (lane: TimelineLane) => timeline.lanes.find((l) => l.lane === lane)?.items ?? []
  const parts: SummaryPart[] = []

  const queries = count('db')
  if (queries) {
    const ms = items('db').reduce((sum, i) => sum + (i.kind === 'group' ? i.totalMs : i.durationMs), 0)
    parts.push({ lane: 'db', text: `${plural(queries, 'query', 'queries')} · ${fmtMs(ms)}` })
  }
  const add = (lane: TimelineLane, one: string, many?: string) => {
    const n = count(lane)
    if (!n) return
    const errors = items(lane).filter((i) => i.isError).length
    parts.push({ lane, text: plural(n, one, many) + (errors && lane !== 'events' ? ` · ${errors} failed` : ''), tone: errors ? 'error' : undefined })
  }
  add('cache', 'cache call')
  add('http', 'outgoing call')
  add('logs', 'log')
  add('events', 'error')
  add('dumps', 'dump')
  add('mail', 'mail')
  add('jobs', 'job')
  return parts
}

// The N+1 line: «30 identical queries SELECT … took 118 ms, from file.php:31».
export const nPlusOneText = (n: SentryNPlusOne) => ({
  count: `${n.count} identical queries`,
  took: `took ${fmtMs(n.total_ms)}`,
  origin: n.origin || ''
})

export const formatMs = fmtMs
