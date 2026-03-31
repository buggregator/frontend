import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SentryTraceDetailPage from './sentry-trace-detail-page.vue';

export default {
  title: "Screens/Sentry/SentryTraceDetailPage",
  component: SentryTraceDetailPage,
  parameters: {
    layout: 'fullscreen',
  }
} as Meta<typeof SentryTraceDetailPage>;

export const Default: StoryObj<typeof SentryTraceDetailPage> = {};
