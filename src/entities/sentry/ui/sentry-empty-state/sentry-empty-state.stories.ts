import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SentryEmptyState from './sentry-empty-state.vue';

export default {
  title: "Entities/Sentry/SentryEmptyState",
  component: SentryEmptyState,
} as Meta<typeof SentryEmptyState>;

export const Exceptions: StoryObj<typeof SentryEmptyState> = {
  args: { type: 'exceptions' },
};

export const Traces: StoryObj<typeof SentryEmptyState> = {
  args: { type: 'traces' },
};

export const Logs: StoryObj<typeof SentryEmptyState> = {
  args: { type: 'logs' },
};
