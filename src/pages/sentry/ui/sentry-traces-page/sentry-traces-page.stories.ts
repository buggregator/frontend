import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SentryTracesPage from './sentry-traces-page.vue';

export default {
  title: "Screens/Sentry/SentryTracesPage",
  component: SentryTracesPage,
  parameters: {
    layout: 'fullscreen',
  }
} as Meta<typeof SentryTracesPage>;

export const Default: StoryObj<typeof SentryTracesPage> = {};
