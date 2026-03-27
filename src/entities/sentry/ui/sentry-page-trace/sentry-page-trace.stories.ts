import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SentryPageTrace from './sentry-page-trace.vue';

export default {
  title: "Entities/Sentry/SentryPageTrace",
  component: SentryPageTrace,
} as Meta<typeof SentryPageTrace>;

export const Default: StoryObj<typeof SentryPageTrace> = {
  args: {
    trace: {
      op: "pageload",
      span_id: "97088fb11b4f9d54",
      status: "internal_error",
      trace_id: "fefb24e1a72047d9b4feeb68bf56497a",
    },
  }
};

export const Ok: StoryObj<typeof SentryPageTrace> = {
  args: {
    trace: {
      op: "http.request",
      span_id: "a1b2c3d4e5f6",
      status: "ok",
      trace_id: "abcdef1234567890abcdef1234567890",
    },
  }
};
