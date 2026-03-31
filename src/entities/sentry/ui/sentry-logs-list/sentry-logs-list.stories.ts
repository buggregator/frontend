import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mockLogs } from "../../mocks";
import SentryLogsList from './sentry-logs-list.vue';

export default {
  title: "Entities/Sentry/SentryLogsList",
  component: SentryLogsList,
} as Meta<typeof SentryLogsList>;

export const Default: StoryObj<typeof SentryLogsList> = {
  args: {
    logs: mockLogs,
    loading: false,
  },
};

export const Loading: StoryObj<typeof SentryLogsList> = {
  args: {
    logs: [],
    loading: true,
  },
};

export const Empty: StoryObj<typeof SentryLogsList> = {
  args: {
    logs: [],
    loading: false,
  },
};
