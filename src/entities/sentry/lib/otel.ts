import type { TelemetrySource } from '../types'

// OpenTelemetry data inside Sentry Traces/Logs (#6523, server #6522).
// The server puts the OTLP-only parts into `attributes` under `otel.*` keys;
// these helpers take them apart for the span and log details.

export const SOURCE_LABEL: Record<TelemetrySource, string> = {
  sentry: 'Sentry SDK',
  otel: 'OTel'
}

export type OtelEvent = { name: string; time: string | null; attributes: Record<string, unknown> }
export type OtelLink = { trace_id: string; span_id: string; attributes: Record<string, unknown> }
export type OtelScope = { name: string; version: string | null }
export type OtelException = { type: string; message: string; stacktrace: string; time: string | null }

export type OtelParts = {
  // What is left for the Attributes tab: the span's or log's own attributes.
  attributes: Record<string, unknown>
  resource: Record<string, unknown>
  scope: OtelScope | null
  events: OtelEvent[]
  links: OtelLink[]
  kind: string | null
}

const EXTRA_KEYS = ['otel.resource', 'otel.scope', 'otel.events', 'otel.links', 'otel.kind']

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v))

export const splitOtelAttributes = (attrs: Record<string, unknown> | null | undefined): OtelParts => {
  const all = attrs ?? {}
  const attributes: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(all)) if (!EXTRA_KEYS.includes(k)) attributes[k] = v

  const scopeRaw = all['otel.scope']
  const events = Array.isArray(all['otel.events']) ? all['otel.events'] : []
  const links = Array.isArray(all['otel.links']) ? all['otel.links'] : []

  return {
    attributes,
    resource: isRecord(all['otel.resource']) ? all['otel.resource'] : {},
    scope: isRecord(scopeRaw) && scopeRaw.name ? { name: str(scopeRaw.name), version: str(scopeRaw.version) || null } : null,
    events: events.filter(isRecord).map((e) => ({
      name: str(e.name),
      time: e.time ? str(e.time) : null,
      attributes: isRecord(e.attributes) ? e.attributes : {}
    })),
    links: links.filter(isRecord).map((l) => ({
      trace_id: str(l.trace_id),
      span_id: str(l.span_id),
      attributes: isRecord(l.attributes) ? l.attributes : {}
    })),
    kind: all['otel.kind'] ? str(all['otel.kind']) : null
  }
}

// The first «exception» span event, the way OTel SDKs record errors.
export const otelException = (events: OtelEvent[]): OtelException | null => {
  const e = events.find((ev) => ev.name === 'exception')
  if (!e) return null
  const a = e.attributes
  return {
    type: str(a['exception.type']),
    message: str(a['exception.message']),
    stacktrace: str(a['exception.stacktrace']),
    time: e.time
  }
}

// «shop-web → checkout-api → payments-worker»; long chains keep the ends.
export const servicesChain = (services: string[] | undefined, max = 3): string => {
  const list = services ?? []
  if (list.length <= max) return list.join(' → ')
  return [...list.slice(0, max - 1), '…', list[list.length - 1]].join(' → ')
}

export const formatAttrValue = (val: unknown): string => {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}
