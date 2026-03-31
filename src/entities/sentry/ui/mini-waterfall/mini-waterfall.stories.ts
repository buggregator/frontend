import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mockPreviewSpans } from "../../mocks";
import MiniWaterfall from './mini-waterfall.vue';

export default {
  title: "Entities/Sentry/MiniWaterfall",
  component: MiniWaterfall,
} as Meta<typeof MiniWaterfall>;

export const ThreeSpans: StoryObj<typeof MiniWaterfall> = {
  args: {
    spans: mockPreviewSpans,
    totalMs: 234,
    maxSpans: 3,
  },
};

export const FiveSpans: StoryObj<typeof MiniWaterfall> = {
  args: {
    spans: [
      ...mockPreviewSpans,
      { span_id: 's4', op: 'queue.publish', description: 'order-notifications', start_offset_ms: 210, duration_ms: 15, peer_type: 'queue', is_error: false },
      { span_id: 's5', op: 'db.query', description: 'UPDATE orders SET notified=1', start_offset_ms: 225, duration_ms: 5, peer_type: 'db', is_error: false },
    ],
    totalMs: 234,
    maxSpans: 5,
  },
};

export const WithError: StoryObj<typeof MiniWaterfall> = {
  args: {
    spans: [
      { span_id: 's1', op: 'db.query', description: 'SELECT * FROM users', start_offset_ms: 10, duration_ms: 80, peer_type: 'db', is_error: false },
      { span_id: 's2', op: 'http.client', description: 'api.stripe.com/charge', start_offset_ms: 100, duration_ms: 150, peer_type: 'http', is_error: true },
    ],
    totalMs: 260,
    maxSpans: 3,
  },
};
