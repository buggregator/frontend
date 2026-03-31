import type { Meta, StoryObj } from "@storybook/vue3-vite";
import type { SentryTrace } from "../../types";
import TracePreviewCard from './trace-preview-card.vue';

const mockTrace: SentryTrace = {
  trace_id: 'aabbccdd11223344',
  transaction_id: 'txn-uuid-1',
  transaction_name: 'GET /api/users',
  op: 'http.server',
  status: 'ok',
  duration_ms: 234,
  span_count: 5,
  error_count: 0,
  received_at: '2025-03-30T14:23:44Z',
  preview_spans: [
    { span_id: 's1', op: 'db.query', description: 'SELECT * FROM users WHERE active = 1', start_offset_ms: 18, duration_ms: 128, peer_type: 'db', is_error: false },
    { span_id: 's2', op: 'http.client', description: 'api.stripe.com/charges', start_offset_ms: 155, duration_ms: 30, peer_type: 'http', is_error: false },
    { span_id: 's3', op: 'cache.get', description: 'user:permissions:42', start_offset_ms: 195, duration_ms: 8, peer_type: 'cache', is_error: false },
  ],
}

export default {
  title: "Entities/Sentry/TracePreviewCard",
  component: TracePreviewCard,
} as Meta<typeof TracePreviewCard>;

export const Default: StoryObj<typeof TracePreviewCard> = {
  args: { trace: mockTrace },
};

export const WithErrors: StoryObj<typeof TracePreviewCard> = {
  args: {
    trace: {
      ...mockTrace,
      error_count: 2,
      status: 'internal_error',
      preview_spans: [
        ...mockTrace.preview_spans.slice(0, 1),
        { span_id: 's2', op: 'db.query', description: 'INSERT INTO orders...', start_offset_ms: 150, duration_ms: 45, peer_type: 'db', is_error: true },
      ],
    },
  },
};

export const LongTransaction: StoryObj<typeof TracePreviewCard> = {
  args: {
    trace: { ...mockTrace, transaction_name: 'POST /api/v2/checkout/process-payment-and-notify', duration_ms: 4523, span_count: 47 },
  },
};
