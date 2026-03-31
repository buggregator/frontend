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
}

export interface SentryServiceMapNode {
  id: string
  label: string
  request_count: number
  error_count: number
  avg_duration_ms: number | null
}

export interface SentryServiceMapEdge {
  source: string
  target: string
  op_type: string
  request_count: number
  error_count: number
  avg_duration_ms: number | null
}

export interface SentryServiceMap {
  nodes: SentryServiceMapNode[]
  edges: SentryServiceMapEdge[]
  window_minutes: number
}

export interface SentryCounts {
  exceptions: number
  traces: number
  logs: number
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
