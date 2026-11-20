import type { SentryFlow, SentrySequence } from '../../types'

// View C (#6533, readability spec #6531): requests across service lanes over a
// period, and one request's calls as a sequence diagram. Pure geometry: the
// components only draw what these return.

export type FlowBox = { width: number; left?: number; right?: number; top?: number; laneHeight?: number }

export type FlowLane = { service: string; y: number }
export type FlowSegment = { y1: number; y2: number }
export type FlowStroke = {
  traceId: string
  name: string
  durationMs: number
  isError: boolean
  x: number
  segments: FlowSegment[]
  dots: number[]
}
export type FlowTick = { x: number; label: string }
export type FlowBar = { x: number; width: number; count: number; errors: number; t: string }

export type FlowLayout = {
  lanes: FlowLane[]
  strokes: FlowStroke[]
  ticks: FlowTick[]
  bars: FlowBar[]
  plotLeft: number
  plotRight: number
  height: number
}

const MINUTE = 60_000
const TICK_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 360, 720, 1440].map((m) => m * MINUTE)
const MAX_TICKS = 10

const pad = (n: number) => String(n).padStart(2, '0')
const tickLabel = (t: number, step: number) => {
  const d = new Date(t)
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  return step >= 1440 * MINUTE ? `${d.getMonth() + 1}/${d.getDate()}` : hm
}

export const flowTicks = (from: number, to: number, scale: (t: number) => number): FlowTick[] => {
  const span = Math.max(1, to - from)
  const step = TICK_STEPS.find((s) => span / s <= MAX_TICKS) ?? TICK_STEPS[TICK_STEPS.length - 1]
  const ticks: FlowTick[] = []
  for (let t = Math.ceil(from / step) * step; t <= to; t += step) ticks.push({ x: scale(t), label: tickLabel(t, step) })
  return ticks
}

export const layoutFlow = (flow: SentryFlow, box: FlowBox): FlowLayout => {
  const left = box.left ?? 150
  const right = box.right ?? 24
  const top = box.top ?? 24
  const laneHeight = box.laneHeight ?? 60
  const plotLeft = left
  const plotRight = Math.max(left + 1, box.width - right)

  const services = [...flow.services]
  for (const r of flow.requests) for (const s of r.services) if (!services.includes(s.service)) services.push(s.service)
  const laneIndex = new Map(services.map((s, i) => [s, i]))
  const lanes = services.map((service, i) => ({ service, y: top + i * laneHeight }))

  const from = Date.parse(flow.from)
  const to = Date.parse(flow.to)
  const scale = (t: number) => plotLeft + ((t - from) / Math.max(1, to - from)) * (plotRight - plotLeft)

  const strokes = flow.requests.map((r) => {
    const ys = [...new Set(r.services.map((s) => laneIndex.get(s.service)!))]
      .sort((a, b) => a - b)
      .map((i) => lanes[i].y)
    const segments = ys.slice(1).map((y2, i) => ({ y1: ys[i], y2 }))
    return {
      traceId: r.trace_id,
      name: r.name,
      durationMs: r.duration_ms,
      isError: r.is_error,
      x: scale(Date.parse(r.start_ts)),
      segments,
      dots: ys
    }
  })

  const stepMs = flow.bucket_seconds * 1000
  const barWidth = Math.max(1, ((plotRight - plotLeft) * stepMs) / Math.max(1, to - from) - 2)
  const bars = flow.buckets.map((b) => ({ x: scale(Date.parse(b.t)) + 1, width: barWidth, count: b.count, errors: b.errors, t: b.t }))

  return {
    lanes,
    strokes,
    ticks: flowTicks(from, to, scale),
    bars,
    plotLeft,
    plotRight,
    height: top + Math.max(0, lanes.length - 1) * laneHeight + top
  }
}

// --- Sequence diagram ---

export type SequenceLifeline = { service: string; x: number }
export type SequenceArrow = {
  kind: 'call' | 'reply'
  y: number
  fromX: number
  toX: number
  label: string
  isError: boolean
  late: boolean
}
export type SequenceActivation = { service: string; x: number; y1: number; y2: number; isError: boolean }
export type SequenceNote = { x: number; y: number; text: string }
export type SequenceLayout = {
  lifelines: SequenceLifeline[]
  arrows: SequenceArrow[]
  activations: SequenceActivation[]
  notes: SequenceNote[]
  height: number
}

export type SequenceBox = { width: number; top?: number; row?: number; side?: number }

const ms = (n: number | null) => (n === null ? '' : `${Math.round(n)} ms`)

type SeqEvent = { t: number; order: number; arrow: Omit<SequenceArrow, 'y' | 'fromX' | 'toX'> & { from: string; to: string }; callIndex: number; end?: boolean }

export const layoutSequence = (seq: SentrySequence, box: SequenceBox): SequenceLayout => {
  const top = box.top ?? 48
  const row = box.row ?? 44
  const side = box.side ?? 90

  const services = [...seq.services]
  for (const c of seq.calls) for (const s of [c.from, c.to]) if (!services.includes(s)) services.push(s)
  const gap = services.length > 1 ? (box.width - side * 2) / (services.length - 1) : 0
  const lifelines = services.map((service, i) => ({ service, x: services.length > 1 ? side + i * gap : box.width / 2 }))
  const xOf = new Map(lifelines.map((l) => [l.service, l.x]))

  const events: SeqEvent[] = []
  seq.calls.forEach((c, i) => {
    const failed = c.is_error
    events.push({
      t: Date.parse(c.start_ts),
      order: 0,
      callIndex: i,
      arrow: {
        kind: 'call',
        from: c.from,
        to: c.to,
        label: `${c.description || c.op_type}${c.duration_ms !== null ? ` · ${ms(c.duration_ms)}` : ''}${failed ? ` · ${c.status || 'error'}` : ''}`,
        isError: failed,
        late: false
      }
    })
    events.push({
      t: Date.parse(c.end_ts),
      order: 1,
      callIndex: i,
      end: true,
      arrow: { kind: 'reply', from: c.to, to: c.from, label: failed ? c.status || 'error' : 'ok', isError: failed, late: false }
    })
    const late = c.late_ms ?? 0
    if (c.callee && late > 0) {
      events.push({
        t: Date.parse(c.callee.end_ts),
        order: 1,
        callIndex: i,
        end: true,
        arrow: {
          kind: 'reply',
          from: c.to,
          to: c.from,
          label: `${c.callee.is_error ? 'error' : 'ok'} (too late, +${ms(late)})`,
          isError: c.callee.is_error,
          late: true
        }
      })
    }
  })
  // Time order; at one instant calls before replies, an inner reply before its caller's.
  events.sort((a, b) => a.t - b.t || a.order - b.order || (a.order === 0 ? a.callIndex - b.callIndex : b.callIndex - a.callIndex))

  const arrows: SequenceArrow[] = []
  const callRow = new Map<number, number>()
  const lastReplyRow = new Map<number, number>()
  events.forEach((e, i) => {
    const y = top + i * row
    const { from, to, ...rest } = e.arrow
    arrows.push({ ...rest, y, fromX: xOf.get(from)!, toX: xOf.get(to)! })
    if (e.arrow.kind === 'call') callRow.set(e.callIndex, y)
    else lastReplyRow.set(e.callIndex, Math.max(lastReplyRow.get(e.callIndex) ?? 0, y))
  })

  const activations: SequenceActivation[] = []
  const notes: SequenceNote[] = []
  seq.calls.forEach((c, i) => {
    const y1 = callRow.get(i)!
    const y2 = lastReplyRow.get(i) ?? y1 + row
    activations.push({ service: c.to, x: xOf.get(c.to)!, y1, y2, isError: !!c.callee?.is_error })
    if ((c.late_ms ?? 0) > 0) {
      notes.push({
        x: xOf.get(c.to)!,
        y: y2 - row / 2,
        text: `${c.to} kept working +${ms(c.late_ms)} after ${c.from} gave up`
      })
    }
  })

  return { lifelines, arrows, activations, notes, height: top + events.length * row + 16 }
}
