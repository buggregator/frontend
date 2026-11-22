import { monologLevelColor } from '@/entities/monolog'
import { sentryLogTone, type MarkerTone, type TimelineMarker } from '@/entities/sentry'
import type { SentryLog, SentryRelatedError } from '@/entities/sentry/types'
import { EventTypes, RouteName, type ServerEvent } from '@/shared/types'

// The other modules' events of one request (#6715) as moments on its scale:
// Monolog records, mails and HTTP dumps with the same trace id (#6714), plus
// the trace's Sentry errors and logs. Each is placed by its own time.

type Address = { name?: string; email: string }
type Payload = Record<string, unknown>

const ms = (iso: string | undefined | null) => {
  const t = iso ? Date.parse(iso) : NaN
  return Number.isFinite(t) ? t : null
}

const monologTone = (level: string | undefined): MarkerTone | undefined => {
  const color = monologLevelColor(level)
  if (color === 'red') return 'error'
  if (color === 'amber' || color === 'orange') return 'warning'
  return undefined
}

const addresses = (list: unknown) =>
  Array.isArray(list) ? (list as Address[]).map((a) => a.name ? `${a.name} <${a.email}>` : a.email).join(', ') : ''

const eventMarker = (event: ServerEvent<unknown>, startMs: number): TimelineMarker => {
  const p = (event.payload ?? {}) as Payload
  const to = { name: RouteName.EventPage, params: { type: event.type, id: event.uuid } }
  const received = event.timestamp * 1000
  const base = { id: event.uuid, to }

  if (event.type === EventTypes.Monolog) {
    const level = String(p.level_name ?? '')
    return {
      ...base,
      lane: 'logs',
      atMs: (ms(p.datetime as string) ?? received) - startMs,
      label: `${level} ${String(p.message ?? '')}`.trim(),
      tone: monologTone(level),
      details: [`Monolog · ${String(p.channel ?? '')}`]
    }
  }
  if (event.type === EventTypes.Smtp) {
    const recipients = addresses(p.to)
    return {
      ...base,
      lane: 'mail',
      atMs: received - startMs,
      label: `${String(p.subject || '(no subject)')}${recipients ? ` → ${recipients}` : ''}`,
      details: [`From: ${addresses(p.from) || '—'}`, `To: ${recipients || '—'}`]
    }
  }
  const request = (p.request ?? {}) as Payload
  return {
    ...base,
    lane: 'dumps',
    atMs: received - startMs,
    label: event.type === EventTypes.HttpDump ? `${String(request.method ?? '')} ${String(request.uri ?? '')}`.trim() : event.type,
    details: [event.type === EventTypes.HttpDump ? 'HTTP dump' : event.type]
  }
}

export const traceMarkers = (
  startTs: string,
  events: ServerEvent<unknown>[],
  errors: SentryRelatedError[],
  logs: SentryLog[]
): TimelineMarker[] => {
  const start = ms(startTs) ?? 0
  return [
    ...events.map((e) => eventMarker(e, start)),
    ...errors.map((e) => ({
      id: e.id,
      lane: 'events' as const,
      atMs: (ms(e.received_at) ?? start) - start,
      label: e.exception_type || 'Error',
      tone: 'error' as const,
      to: { name: RouteName.SentryExceptionDetail, params: { id: e.id } },
      details: ['Sentry error']
    })),
    ...logs.map((l) => ({
      id: l.id,
      lane: 'logs' as const,
      atMs: (ms(l.log_ts) ?? start) - start,
      label: `${l.level.toUpperCase()} ${l.body}`,
      tone: sentryLogTone(l.level),
      details: [`Sentry log${l.service_name ? ` · ${l.service_name}` : ''}`]
    }))
  ]
}
