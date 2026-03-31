import type { Meta, StoryObj } from "@storybook/vue3-vite";
import type { SentrySpan } from "../../types";
import TraceWaterfall from './trace-waterfall.vue';

const mockSpans: SentrySpan[] = [
  { span_id: 'root', parent_span_id: null, op: 'http.server', description: 'GET /api/users', status: 'ok', start_offset_ms: 0, duration_ms: 234, peer_type: null, peer_address: null, is_error: false },
  { span_id: 'db1', parent_span_id: 'root', op: 'db.query', description: 'SELECT * FROM users WHERE active = 1', status: 'ok', start_offset_ms: 18, duration_ms: 128, peer_type: 'db', peer_address: 'mysql:3306', is_error: false },
  { span_id: 'cache1', parent_span_id: 'root', op: 'cache.get', description: 'user:permissions', status: 'ok', start_offset_ms: 150, duration_ms: 8, peer_type: 'cache', peer_address: 'redis:6379', is_error: false },
  { span_id: 'http1', parent_span_id: 'root', op: 'http.client', description: 'POST https://api.stripe.com/charges', status: 'internal_error', start_offset_ms: 165, duration_ms: 45, peer_type: 'http', peer_address: 'api.stripe.com', is_error: true },
  { span_id: 'db2', parent_span_id: 'http1', op: 'db.query', description: 'INSERT INTO payments...', status: 'ok', start_offset_ms: 170, duration_ms: 12, peer_type: 'db', peer_address: 'mysql:3306', is_error: false },
]

export default {
  title: "Entities/Sentry/TraceWaterfall",
  component: TraceWaterfall,
  parameters: { layout: 'fullscreen' },
} as Meta<typeof TraceWaterfall>;

export const Default: StoryObj<typeof TraceWaterfall> = {
  args: { spans: mockSpans, totalMs: 234 },
};

export const WithErrors: StoryObj<typeof TraceWaterfall> = {
  args: { spans: mockSpans, totalMs: 234 },
};

export const Empty: StoryObj<typeof TraceWaterfall> = {
  args: { spans: [], totalMs: 0 },
};
