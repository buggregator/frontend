import type { SentrySequence } from '../../types'

// A trace's calls as a sequence diagram (#6533, trace page «Sequence» tab).

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
