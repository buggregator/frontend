import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mockPreviewSpans } from "../../mocks";
import TraceContextBlock from './trace-context-block.vue';

export default {
  title: "Entities/Sentry/TraceContextBlock",
  component: TraceContextBlock,
} as Meta<typeof TraceContextBlock>;

export const Default: StoryObj<typeof TraceContextBlock> = {
  args: {
    traceSummary: {
      trace_id: 'aabbccdd11223344eeff00112233',
      transaction_name: 'GET /api/users',
      op: 'http.server',
      duration_ms: 234,
      span_count: 5,
      preview_spans: mockPreviewSpans,
    },
  },
};

export const NoSpans: StoryObj<typeof TraceContextBlock> = {
  args: {
    traceSummary: {
      trace_id: 'aabbccdd11223344',
      transaction_name: 'GET /api/health',
      op: 'http.server',
      duration_ms: 3,
      span_count: 1,
      preview_spans: [],
    },
  },
};

export const Null: StoryObj<typeof TraceContextBlock> = {
  args: {
    traceSummary: null,
  },
};
