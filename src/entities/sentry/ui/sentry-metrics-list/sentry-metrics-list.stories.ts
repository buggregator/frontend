import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mockMetrics } from "../../mocks";
import SentryMetricsList from './sentry-metrics-list.vue';

export default {
  title: "Entities/Sentry/SentryMetricsList",
  component: SentryMetricsList,
} as Meta<typeof SentryMetricsList>;

export const Default: StoryObj<typeof SentryMetricsList> = {
  args: {
    metrics: mockMetrics,
    loading: false,
  },
};

export const Loading: StoryObj<typeof SentryMetricsList> = {
  args: {
    metrics: [],
    loading: true,
  },
};

export const Empty: StoryObj<typeof SentryMetricsList> = {
  args: {
    metrics: [],
    loading: false,
  },
};
