import { PAGES_SETTINGS } from '../../constants/pages'
import { type ServerEvent, isEventType } from '../../types'
import { sentryList } from '../helpers/sentry-list'

// A short name of an event for the agents panel: the thread chip, Recent and
// the rows a list page sends. «Sentry error · OrderError: Order 15 not found».

const MAX = 120

const clip = (text: string) => {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length > MAX ? `${t.slice(0, MAX - 1)}…` : t
}

type Any = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')

const sentrySubject = (p: Any): { kind: string; text: string } => {
  const values = sentryList<{ type?: string; value?: string }>(p.exception as never)
  const main = values[values.length - 1]
  if (main) return { kind: 'error', text: [main.type, main.value].filter(Boolean).join(': ') }
  const m = (p.message ?? p.logentry) as unknown
  const text = typeof m === 'string' ? m : str((m as Any)?.formatted) || str((m as Any)?.message)
  if (text) return { kind: 'message', text }
  if (p.type === 'transaction') return { kind: 'transaction', text: str(p.transaction) }
  return { kind: 'event', text: '' }
}

// The event's own words, without the type.
export const eventSubject = (event: ServerEvent<unknown>): string => {
  const p = (event.payload ?? {}) as Any
  switch (event.type) {
    case 'sentry':
      return clip(sentrySubject(p).text)
    case 'monolog':
      return clip([str(p.level_name), str(p.message)].filter(Boolean).join(' '))
    case 'smtp':
      return clip(str(p.subject))
    case 'http-dump': {
      const r = (p.request ?? {}) as Any
      return clip([str(r.method), str(r.uri)].filter(Boolean).join(' '))
    }
    default:
      return ''
  }
}

export const eventTypeTitle = (event: ServerEvent<unknown>): string => {
  if (event.type === 'sentry') {
    return `Sentry ${sentrySubject((event.payload ?? {}) as Any).kind}`
  }
  return isEventType(event.type) ? PAGES_SETTINGS[event.type]?.title ?? event.type : event.type
}

export const eventContextTitle = (event: ServerEvent<unknown>): string => {
  const subject = eventSubject(event)
  const type = eventTypeTitle(event)
  return subject ? `${type} · ${subject}` : `${type} · ${event.uuid.slice(0, 8)}`
}
