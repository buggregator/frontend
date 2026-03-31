import type {
  SentryErrorGroup,
  SentryExceptionItem,
  SentryTrace,
  SentryTraceDetail,
  SentrySpan,
  SentrySpanPreview,
  SentryLog,
  SentryServiceMap,
  SentryCounts,
} from '../types-v2'

export const mockCounts: SentryCounts = {
  exceptions: 199,
  traces: 42,
  logs: 320,
}

export const mockExceptionGroups: SentryErrorGroup[] = [
  {
    fingerprint: 'a1b2c3d4e5f6a7b8',
    exception_type: 'Illuminate\\Database\\QueryException',
    exception_value: 'SQLSTATE[HY000]: General error: 2006 MySQL server has gone away',
    count: 184,
    first_seen: '2025-03-28T09:14:00Z',
    last_seen: '2025-03-30T14:23:47Z',
    level: 'error',
    handled: false,
    sample_event_id: 'evt-001',
  },
  {
    fingerprint: 'b2c3d4e5f6a7b8c9',
    exception_type: 'App\\Exceptions\\InsufficientFundsException',
    exception_value: 'Insufficient funds: balance is $0.00, required $49.99 for order #12345',
    count: 47,
    first_seen: '2025-03-29T11:00:00Z',
    last_seen: '2025-03-30T13:45:00Z',
    level: 'error',
    handled: true,
    sample_event_id: 'evt-002',
  },
  {
    fingerprint: 'c3d4e5f6a7b8c9d0',
    exception_type: 'RuntimeException',
    exception_value: 'Cache store [redis] is not defined.',
    count: 12,
    first_seen: '2025-03-30T08:00:00Z',
    last_seen: '2025-03-30T14:10:00Z',
    level: 'error',
    handled: false,
    sample_event_id: 'evt-003',
  },
  {
    fingerprint: 'd4e5f6a7b8c9d0e1',
    exception_type: 'TypeError',
    exception_value: 'Cannot read properties of undefined (reading "map")',
    count: 3,
    first_seen: '2025-03-30T12:00:00Z',
    last_seen: '2025-03-30T12:05:00Z',
    level: 'warning',
    handled: true,
    sample_event_id: 'evt-004',
  },
]

export const mockExceptionItems: SentryExceptionItem[] = [
  {
    id: 'evt-001-a',
    event_id: 'sentry-evt-001-a',
    fingerprint: 'a1b2c3d4e5f6a7b8',
    occurrence_count: 184,
    exception_type: 'Illuminate\\Database\\QueryException',
    exception_value: 'SQLSTATE[HY000]: General error: 2006 MySQL server has gone away',
    level: 'error',
    handled: false,
    transaction: 'GET /api/orders',
    received_at: '2025-03-30T14:23:47Z',
    trace_id: 'aabbccdd11223344',
  },
  {
    id: 'evt-002-a',
    event_id: 'sentry-evt-002-a',
    fingerprint: 'b2c3d4e5f6a7b8c9',
    occurrence_count: 47,
    exception_type: 'App\\Exceptions\\InsufficientFundsException',
    exception_value: 'Insufficient funds: balance is $0.00',
    level: 'error',
    handled: true,
    transaction: 'POST /api/checkout',
    received_at: '2025-03-30T13:45:00Z',
    trace_id: null,
  },
  {
    id: 'evt-003-a',
    event_id: 'sentry-evt-003-a',
    fingerprint: 'c3d4e5f6a7b8c9d0',
    occurrence_count: 12,
    exception_type: 'RuntimeException',
    exception_value: 'Cache store [redis] is not defined.',
    level: 'error',
    handled: false,
    transaction: 'GET /api/products',
    received_at: '2025-03-30T14:10:00Z',
    trace_id: 'eeff0011aabbccdd',
  },
]

export const mockPreviewSpans: SentrySpanPreview[] = [
  { span_id: 's1', op: 'db.query', description: 'SELECT * FROM users WHERE active = 1', start_offset_ms: 18, duration_ms: 128, peer_type: 'db', is_error: false },
  { span_id: 's2', op: 'http.client', description: 'POST api.stripe.com/charges', start_offset_ms: 155, duration_ms: 30, peer_type: 'http', is_error: false },
  { span_id: 's3', op: 'cache.get', description: 'user:permissions:42', start_offset_ms: 195, duration_ms: 8, peer_type: 'cache', is_error: false },
]

export const mockTraces: SentryTrace[] = [
  {
    trace_id: 'aabbccdd11223344',
    transaction_id: 'txn-001',
    transaction_name: 'GET /api/users',
    op: 'http.server',
    status: 'ok',
    duration_ms: 234,
    span_count: 5,
    error_count: 0,
    received_at: '2025-03-30T14:23:44Z',
    preview_spans: mockPreviewSpans,
  },
  {
    trace_id: 'eeff001122334455',
    transaction_id: 'txn-002',
    transaction_name: 'POST /api/checkout/process',
    op: 'http.server',
    status: 'internal_error',
    duration_ms: 4523,
    span_count: 23,
    error_count: 2,
    received_at: '2025-03-30T14:20:00Z',
    preview_spans: [
      { span_id: 'ps1', op: 'db.query', description: 'INSERT INTO orders...', start_offset_ms: 45, duration_ms: 2100, peer_type: 'db', is_error: false },
      { span_id: 'ps2', op: 'http.client', description: 'payment-gateway.com/charge', start_offset_ms: 2200, duration_ms: 1800, peer_type: 'http', is_error: true },
      { span_id: 'ps3', op: 'queue.publish', description: 'order-notifications', start_offset_ms: 4100, duration_ms: 50, peer_type: 'queue', is_error: false },
    ],
  },
  {
    trace_id: 'aabb001122334455',
    transaction_id: 'txn-003',
    transaction_name: 'GET /api/products',
    op: 'http.server',
    status: 'ok',
    duration_ms: 89,
    span_count: 3,
    error_count: 0,
    received_at: '2025-03-30T14:15:00Z',
    preview_spans: [
      { span_id: 'pp1', op: 'cache.get', description: 'products:list:page:1', start_offset_ms: 5, duration_ms: 3, peer_type: 'cache', is_error: false },
      { span_id: 'pp2', op: 'db.query', description: 'SELECT * FROM products LIMIT 20', start_offset_ms: 12, duration_ms: 65, peer_type: 'db', is_error: false },
    ],
  },
]

export const mockSpans: SentrySpan[] = [
  { span_id: 'root', parent_span_id: null, op: 'http.server', description: 'GET /api/users', status: 'ok', start_offset_ms: 0, duration_ms: 234, peer_type: null, peer_address: null, is_error: false },
  { span_id: 'db1', parent_span_id: 'root', op: 'db.query', description: 'SELECT * FROM users WHERE active = 1', status: 'ok', start_offset_ms: 18, duration_ms: 128, peer_type: 'db', peer_address: 'mysql:3306', is_error: false },
  { span_id: 'cache1', parent_span_id: 'root', op: 'cache.get', description: 'user:permissions', status: 'ok', start_offset_ms: 150, duration_ms: 8, peer_type: 'cache', peer_address: 'redis:6379', is_error: false },
  { span_id: 'http1', parent_span_id: 'root', op: 'http.client', description: 'POST https://api.stripe.com/charges', status: 'internal_error', start_offset_ms: 165, duration_ms: 45, peer_type: 'http', peer_address: 'api.stripe.com', is_error: true },
  { span_id: 'db2', parent_span_id: 'http1', op: 'db.query', description: 'INSERT INTO payments (amount, status) VALUES (49.99, "pending")', status: 'ok', start_offset_ms: 170, duration_ms: 12, peer_type: 'db', peer_address: 'mysql:3306', is_error: false },
]

export const mockTraceDetail: SentryTraceDetail = {
  trace_id: 'aabbccdd11223344',
  transaction: {
    id: 'txn-001',
    transaction_name: 'GET /api/users',
    op: 'http.server',
    status: 'ok',
    start_ts: '2025-03-30T14:23:44Z',
    end_ts: '2025-03-30T14:23:44.234Z',
    duration_ms: 234,
  },
  spans: mockSpans,
  related_errors: [
    { id: 'evt-err-1', exception_type: 'QueryException', received_at: '2025-03-30T14:23:44.180Z' },
  ],
  related_log_count: 15,
}

export const mockLogs: SentryLog[] = [
  { id: 'log-1', level: 'info', severity_number: 9, body: 'User John has logged in!', trace_id: 'aabbccdd11223344', span_id: 'root', log_ts: '2025-03-30T14:23:44.001Z', attributes: { 'sentry.message.template': 'User %s has logged in!', 'user.id': 42 } },
  { id: 'log-2', level: 'warning', severity_number: 13, body: 'Slow query detected: 128ms for SELECT * FROM users', trace_id: 'aabbccdd11223344', span_id: 'db1', log_ts: '2025-03-30T14:23:44.146Z', attributes: { 'db.statement': 'SELECT * FROM users WHERE active = 1', 'db.duration_ms': 128 } },
  { id: 'log-3', level: 'error', severity_number: 17, body: 'Payment gateway connection refused', trace_id: 'eeff001122334455', span_id: 'http1', log_ts: '2025-03-30T14:20:02.200Z', attributes: { 'http.url': 'https://payment-gateway.com/charge', 'error.code': 'ECONNREFUSED' } },
  { id: 'log-4', level: 'debug', severity_number: 5, body: 'Cache hit for key user:permissions:42', trace_id: null, span_id: null, log_ts: '2025-03-30T14:23:44.150Z', attributes: null },
  { id: 'log-5', level: 'info', severity_number: 9, body: 'Request completed successfully', trace_id: 'aabbccdd11223344', span_id: 'root', log_ts: '2025-03-30T14:23:44.234Z', attributes: { 'http.status_code': 200, 'http.method': 'GET' } },
]

export const mockServiceMap: SentryServiceMap = {
  nodes: [
    { id: 'laravel-app', label: 'Laravel app', request_count: 1200, error_count: 12, avg_duration_ms: 189 },
    { id: 'mysql:3306', label: 'DB: mysql:3306', request_count: 4800, error_count: 3, avg_duration_ms: 45 },
    { id: 'redis:6379', label: 'Cache: redis:6379', request_count: 9600, error_count: 0, avg_duration_ms: 2 },
    { id: 'api.stripe.com', label: 'api.stripe.com', request_count: 320, error_count: 8, avg_duration_ms: 890 },
    { id: 'rabbitmq:5672', label: 'Queue: rabbitmq:5672', request_count: 600, error_count: 0, avg_duration_ms: 12 },
  ],
  edges: [
    { source: 'laravel-app', target: 'mysql:3306', op_type: 'db', request_count: 4800, error_count: 3, avg_duration_ms: 45 },
    { source: 'laravel-app', target: 'redis:6379', op_type: 'cache', request_count: 9600, error_count: 0, avg_duration_ms: 2 },
    { source: 'laravel-app', target: 'api.stripe.com', op_type: 'http', request_count: 320, error_count: 8, avg_duration_ms: 890 },
    { source: 'laravel-app', target: 'rabbitmq:5672', op_type: 'queue', request_count: 600, error_count: 0, avg_duration_ms: 12 },
  ],
  window_minutes: 60,
}
