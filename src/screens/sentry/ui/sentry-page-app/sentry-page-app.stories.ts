import type { Meta, StoryObj } from "@storybook/vue3";
import { useSentry } from "~/src/entities/sentry";
import { sentryCommonMock } from '~/src/entities/sentry/mocks';
import SentryPageApp from './sentry-page-app.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Screens/sentry/SentryPageApp",
  component: SentryPageApp
} as Meta<typeof SentryPageApp>;


export const Default: StoryObj<typeof SentryPageApp> = {
  args: {
    app: normalizeSentryEvent(sentryCommonMock).payload?.contexts?.app,
  }
};
