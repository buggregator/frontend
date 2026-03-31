import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SentryExceptionsPage from './sentry-exceptions-page.vue';

export default {
  title: "Screens/Sentry/SentryExceptionsPage",
  component: SentryExceptionsPage,
  parameters: {
    layout: 'fullscreen',
  }
} as Meta<typeof SentryExceptionsPage>;

export const Default: StoryObj<typeof SentryExceptionsPage> = {};
