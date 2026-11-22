import type { LocationQuery, LocationQueryRaw } from 'vue-router'

// What the Logs page shows: its URL query, so a view can be shared.
//   ?q=order failed&level=error&level=warning&channel=payments&window=3h&trace=…
// An empty list means «all»; the window is the last hour unless the URL says.
export type LogsFilters = {
  q: string
  levels: string[]
  channels: string[]
  window: string
  trace: string
}

export const DEFAULT_WINDOW = '1h'

const list = (value: LocationQuery[string] | undefined): string[] => {
  const values = Array.isArray(value) ? value : value == null ? [] : [value]
  return [...new Set(values.filter((v): v is string => typeof v === 'string' && v !== ''))]
}
const one = (value: LocationQuery[string] | undefined): string => list(value)[0] ?? ''

export const parseLogsQuery = (query: LocationQuery): LogsFilters => ({
  q: one(query.q).trim(),
  levels: list(query.level).map((l) => l.toLowerCase()),
  channels: list(query.channel),
  window: one(query.window) || DEFAULT_WINDOW,
  trace: one(query.trace)
})

// The query for these filters: what is at its default stays out of the URL.
export const toLogsQuery = (f: LogsFilters): LocationQueryRaw => ({
  q: f.q || undefined,
  level: f.levels.length ? f.levels : undefined,
  channel: f.channels.length ? f.channels : undefined,
  window: f.window && f.window !== DEFAULT_WINDOW ? f.window : undefined,
  trace: f.trace || undefined
})

export const sameFilters = (a: LogsFilters, b: LogsFilters) =>
  JSON.stringify(toLogsQuery(a)) === JSON.stringify(toLogsQuery(b))

// A level chip: on when nothing is picked (all) or it is picked. Turning one
// off from «all» keeps the rest; picking every level is «all» again.
export const isLevelOn = (levels: string[], level: string) =>
  !levels.length || levels.includes(level)

export const toggleLevel = (levels: string[], level: string, all: string[]): string[] => {
  const on = levels.length ? levels : all
  const next = on.includes(level) ? on.filter((l) => l !== level) : [...on, level]
  return all.every((l) => next.includes(l)) ? [] : all.filter((l) => next.includes(l))
}

// The words of a search: the server matches each one on its own.
export const searchWords = (q: string): string[] => [
  ...new Set(q.toLowerCase().split(/\s+/).filter(Boolean))
]

const UNIT: Record<string, number> = { m: 60, h: 3600, d: 86400 }

// The window in seconds; null for «all time» or a value it cannot read.
export const windowSeconds = (window: string): number | null => {
  const m = /^(\d+)([mhd])$/.exec(window)
  return m ? Number(m[1]) * UNIT[m[2]] : null
}

export const hasNarrowing = (f: LogsFilters) => !!(f.q || f.levels.length || f.channels.length)
