import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SentryLogsPage from './sentry-logs-page.vue';

export default {
  title: "Screens/Sentry/SentryLogsPage",
  component: SentryLogsPage,
  parameters: {
    layout: 'fullscreen',
  }
} as Meta<typeof SentryLogsPage>;

export const Default: StoryObj<typeof SentryLogsPage> = {};
