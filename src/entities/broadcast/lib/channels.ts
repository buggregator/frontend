import type { BroadcastChannelKind, BroadcastEvent } from '../types'
import { channelKind } from './payload'

// The console's channel list (#6614, design #6598 B): one row per channel,
// newest activity first; many numbered channels of one family
// (products.118 … products.155) fold into one row `products.*`.

export type BroadcastChannel = {
  // The channel name, or the folded pattern (`products.*`).
  id: string
  kind: BroadcastChannelKind
  // The channels the row stands for: one, or the family.
  channels: string[]
  // Events sent to any of them, each counted once.
  count: number
  last: BroadcastEvent
}

// A family folds from this many channels on.
export const FOLD_MIN = 5

const familyOf = (name: string): string | null => {
  const m = /^(.*[.\-_:])\d+$/.exec(name)
  return m ? `${m[1]}*` : null
}

const newer = (a: BroadcastEvent, b: BroadcastEvent) => (a.timestamp ?? 0) > (b.timestamp ?? 0)

export const buildChannelList = (events: BroadcastEvent[], foldMin = FOLD_MIN): BroadcastChannel[] => {
  const byName = new Map<string, BroadcastEvent[]>()
  for (const e of events) {
    for (const name of new Set(e.payload?.channels ?? [])) {
      const list = byName.get(name)
      if (list) list.push(e)
      else byName.set(name, [e])
    }
  }

  const families = new Map<string, string[]>()
  for (const name of byName.keys()) {
    const family = familyOf(name)
    if (!family) continue
    families.set(family, [...(families.get(family) ?? []), name])
  }

  const rows: { id: string; channels: string[] }[] = []
  const folded = new Set<string>()
  for (const [family, names] of families) {
    if (names.length < foldMin) continue
    names.forEach((n) => folded.add(n))
    rows.push({ id: family, channels: names.sort() })
  }
  for (const name of byName.keys()) {
    if (!folded.has(name)) rows.push({ id: name, channels: [name] })
  }

  return rows
    .map(({ id, channels }) => {
      const seen = new Set<string>()
      let last: BroadcastEvent | null = null
      for (const name of channels) {
        for (const e of byName.get(name) ?? []) {
          seen.add(e.uuid)
          if (!last || newer(e, last)) last = e
        }
      }
      return { id, kind: channelKind(channels[0]), channels, count: seen.size, last: last as BroadcastEvent }
    })
    .sort((a, b) => (b.last.timestamp ?? 0) - (a.last.timestamp ?? 0) || a.id.localeCompare(b.id))
}

export const eventsOfChannel = (events: BroadcastEvent[], channel: BroadcastChannel | null): BroadcastEvent[] => {
  if (!channel) return events
  const names = new Set(channel.channels)
  return events.filter((e) => (e.payload?.channels ?? []).some((c) => names.has(c)))
}

// The channel an event is compared on: the selected one it went to, or its
// first channel in «All channels».
export const compareChannel = (event: BroadcastEvent, channel: BroadcastChannel | null): string | null => {
  const sent = event.payload?.channels ?? []
  if (channel) return sent.find((c) => channel.channels.includes(c)) ?? null
  return sent[0] ?? null
}

// The event with the same name sent to `channelName` just before `event`.
// `events` may come in any order.
export const previousSameEvent = (
  events: BroadcastEvent[],
  event: BroadcastEvent,
  channelName: string | null
): BroadcastEvent | null => {
  if (!channelName) return null
  const at = event.timestamp ?? 0
  let best: BroadcastEvent | null = null
  for (const e of events) {
    if (e.uuid === event.uuid || e.payload?.name !== event.payload?.name) continue
    if (!(e.payload?.channels ?? []).includes(channelName)) continue
    const t = e.timestamp ?? 0
    if (t > at || (t === at && e.uuid >= event.uuid)) continue
    if (!best || t > (best.timestamp ?? 0)) best = e
  }
  return best
}

// Text filter of the stream: the event name, a channel or the data.
export const matchesQuery = (event: BroadcastEvent, query: string): boolean => {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const p = event.payload
  if (event.searchable_text) return event.searchable_text.toLowerCase().includes(q)
  return [p?.name, ...(p?.channels ?? []), p?.data].some((s) => (s ?? '').toLowerCase().includes(q))
}
