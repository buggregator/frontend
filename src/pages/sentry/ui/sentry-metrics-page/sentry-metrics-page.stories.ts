import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SentryMetricsPage from './sentry-metrics-page.vue';

export default {
  title: "Screens/Sentry/SentryMetricsPage",
  component: SentryMetricsPage,
  parameters: {
    layout: 'fullscreen',
  }
} as Meta<typeof SentryMetricsPage>;

export const Default: StoryObj<typeof SentryMetricsPage> = {};
