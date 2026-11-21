// Grouped exception (one row per fingerprint)
export interface SentryErrorGroup {
  fingerprint: string
  exception_type: string
  exception_value: string
  count: number
  first_seen: string
  last_seen: string
  level: string
  handled: boolean | null
  sample_event_id: string
}

// Chronological exception list item
export interface SentryExceptionItem {
  id: string
  event_id: string
  fingerprint: string
  occurrence_count: number
  exception_type: string
  exception_value: string
  level: string
  handled: boolean | null
  transaction: string
  received_at: string
  trace_id: string | null
}

// Summary for embedding in error event detail
export interface SentryTraceSummary {
  trace_id: string
  transaction_name: string
  op: string
  duration_ms: number
  span_count: number
  preview_spans: SentrySpanPreview[]
}

export interface SentrySpanPreview {
  span_id: string
  op: string
  description: string
  start_offset_ms: number
  duration_ms: number
  peer_type: 'db' | 'http' | 'cache' | 'queue' | null
  is_error: boolean
}

// Where the data came from: a Sentry SDK or OpenTelemetry over OTLP (#6522/#6523).
export type TelemetrySource = 'sentry' | 'otel'

export interface SentryTrace {
  trace_id: string
  transaction_id: string
  transaction_name: string
  op: string
  status: string
  duration_ms: number
  span_count: number
  error_count: number
  received_at: string
  preview_spans: SentrySpanPreview[]
  // A trace may mix both (Sentry SDK in one service, OTel in the next).
  sources?: TelemetrySource[]
  // Distinct service.name, in the order the services started.
  services?: string[]
}

export interface SentrySpan {
  span_id: string
  parent_span_id: string | null
  op: string
  description: string
  status: string
  start_offset_ms: number
  duration_ms: number
  peer_type: string | null
  peer_address: string | null
  is_error: boolean
  source?: TelemetrySource
  service_name?: string | null
  // Sentry span data, or OTel attributes with the otel.* extras (see lib/otel.ts).
  attributes?: Record<string, unknown> | null
  // The entry span of another service's transaction (#6522).
  is_transaction?: boolean
  transaction_id?: string
}

export interface SentryTraceDetail {
  trace_id: string
  transaction: {
    id: string
    transaction_name: string
    op: string
    status: string
    start_ts: string
    end_ts: string
    duration_ms: number
    sources?: TelemetrySource[]
    // The root's own span: its children point at it (#6522).
    span_id?: string
    source?: TelemetrySource
    service_name?: string | null
  }
  spans: SentrySpan[]
  related_errors: SentryRelatedError[]
  related_log_count: number
}

export interface SentryRelatedError {
  id: string
  exception_type: string
  received_at: string
}

export interface SentryLog {
  id: string
  level: string
  severity_number: number | null
  body: string
  trace_id: string | null
  span_id: string | null
  log_ts: string
  attributes: Record<string, unknown> | null
  trace_exists?: boolean
  source?: TelemetrySource
  service_name?: string | null
}

export type SentryMetricType = 'counter' | 'gauge' | 'distribution'

export interface SentryMetricAttribute {
  type: string
  value: unknown
}

export interface SentryMetric {
  id: string
  name: string
  type: SentryMetricType | string
  value: number
  unit: string
  trace_id: string
  span_id: string
  metric_ts: string
  attributes: Record<string, SentryMetricAttribute | unknown> | null
}

// Calls per time bucket of the period (service map and flow).
export interface SentryGraphBucket {
  t: string
  count: number
  errors: number
}

// One trace through a service-map edge, errors first then newest.
export interface SentryServiceMapTrace {
  trace_id: string
  start_ts: string
  duration_ms: number
  is_error: boolean
}

// Requests, errors and speed of a node or an edge over the period (#6532).
export interface SentryServiceMapStats {
  request_count: number
  error_count: number
  error_rate?: number
  rpm?: number
  avg_duration_ms: number | null
  p95_duration_ms?: number | null
  buckets?: SentryGraphBucket[]
}

export interface SentryServiceMapNode extends SentryServiceMapStats {
  id: string
  label: string
  // service: sends traces; external: a host or database it calls.
  kind?: 'service' | 'external' | string
}

export interface SentryServiceMapEdge extends SentryServiceMapStats {
  source: string
  target: string
  op_type: string
  trace_count?: number
  // The first 20; the rest from GET /api/sentry/service-map/edge.
  traces?: SentryServiceMapTrace[]
}

export interface SentryServiceMap {
  from?: string
  to?: string
  bucket_seconds?: number
  window_minutes: number
  nodes: SentryServiceMapNode[]
  edges: SentryServiceMapEdge[]
}

export interface SentryServiceMapEdgeTraces {
  total: number
  traces: SentryServiceMapTrace[]
}


// One trace's calls in time order: GET /api/sentry/traces/{id}/sequence.
export interface SentrySequenceCallee {
  service: string
  start_ts: string
  end_ts: string
  duration_ms: number | null
  is_error: boolean
  transaction_id: string | null
}

export interface SentrySequenceCall {
  span_id: string
  from: string
  to: string
  op_type: string
  description: string
  start_ts: string
  end_ts: string
  duration_ms: number | null
  is_error: boolean
  status: string
  callee: SentrySequenceCallee | null
  // The callee kept working this long after the caller stopped waiting (> 0);
  // null without a callee, ≤ 0 when it finished in time.
  late_ms: number | null
}

export interface SentrySequence {
  trace_id: string
  services: string[]
  calls: SentrySequenceCall[]
}

export interface SentryCounts {
  exceptions: number
  traces: number
  logs: number
  metrics: number
  // Servers before buggregator/server #475 do not send it.
  feedback?: number
}

// What a person wrote in the feedback widget, or a legacy user report (#6604).
export interface SentryFeedback {
  id: string
  project: string
  // The error it is about; '' for feedback sent on its own.
  event_id: string
  feedback_id: string
  name: string
  email: string
  message: string
  url: string
  source: 'feedback' | 'user_report'
  received_at: string
}

export interface SentryExceptionDetail {
  id: string
  event_id: string
  fingerprint: string
  level: string
  handled: boolean | null
  platform: string
  environment: string
  server_name: string
  transaction: string
  release: string
  trace_id: string
  span_id: string
  received_at: string
  event_ts: string
  exceptions: SentryExceptionEntry[]
  breadcrumbs: SentryBreadcrumbEntry[]
  trace_summary: SentryTraceSummary | null
  payload: Record<string, unknown>
}

export interface SentryExceptionEntry {
  position: number
  exception_type: string
  exception_value: string
  mechanism_type: string
  handled: boolean | null
  stacktrace: unknown
}

export interface SentryBreadcrumbEntry {
  type: string
  category: string
  level: string
  message: string
  timestamp: string
  data: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
  }
}
