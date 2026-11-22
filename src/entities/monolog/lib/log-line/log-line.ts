import type { Monolog } from '../../types'

type Bag = Record<string, unknown>
const asBag = (value: unknown): Bag =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Bag) : {}

// The request a record belongs to: `trace_id` in extra (a processor puts it
// there) or in context.
export const monologTraceId = (payload: Pick<Monolog, 'context' | 'extra'>): string | null => {
  const id = asBag(payload.extra).trace_id ?? asBag(payload.context).trace_id
  return typeof id === 'string' && id ? id : null
}

// Context keys a summary leaves out: shown elsewhere or too long for a line.
const SKIPPED = new Set(['exception', 'source', 'trace_id', 'project'])

const short = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text

// «user_id=42 items=3»: the first plain values of the context, for the right
// edge of a log line.
export const monologContextSummary = (context: unknown, max = 3, maxValue = 32): string =>
  Object.entries(asBag(context))
    .filter(
      ([key, v]) =>
        !SKIPPED.has(key) && v !== null && ['string', 'number', 'boolean'].includes(typeof v)
    )
    .slice(0, max)
    .map(([key, v]) => `${key}=${short(String(v), maxValue)}`)
    .join(' ')

const pad = (n: number, size = 2) => String(n).padStart(size, '0')

// 14:02:11.482 in local time; the receive time when the record has no date.
export const monologClock = (datetime: string | undefined, fallbackSeconds: number): string => {
  const parsed = datetime ? Date.parse(datetime) : NaN
  const d = new Date(Number.isNaN(parsed) ? fallbackSeconds * 1000 : parsed)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}

const json = (value: unknown) => {
  const bag = asBag(value)
  return Object.keys(bag).length ? ` ${JSON.stringify(bag)}` : ''
}

// The record as Monolog's LineFormatter writes it, for «Copy line».
export const monologLineText = (payload: Monolog): string =>
  `[${payload.datetime}] ${payload.channel}.${(payload.level_name || 'DEBUG').toUpperCase()}: ${payload.message}` +
  `${json(payload.context)}${json(payload.extra)}`
