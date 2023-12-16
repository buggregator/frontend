import type { Meta, StoryObj } from "@storybook/vue3";
import { useSentry } from "~/src/entities/sentry";
import { sentryCommonMock, sentryMock, sentryJSMock, sentryJSEventMock } from '~/src/entities/sentry/mocks';
import SentryPage from './sentry-page.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Screens/sentry/SentryPage",
  component: SentryPage
} as Meta<typeof SentryPage>;


export const PageCommon: StoryObj<typeof SentryPage> = {
  args: {
    event: normalizeSentryEvent(sentryCommonMock),
  }
};

export const PageEvent: StoryObj<typeof SentryPage> = {
  args: {
    event: normalizeSentryEvent(sentryMock),
  }
};

export const PageJS: StoryObj<typeof SentryPage> = {
  args: {
    event: normalizeSentryEvent(sentryJSMock),
  }
};

export const PageJSEvent: StoryObj<typeof SentryPage> = {
  args: {
    event: normalizeSentryEvent(sentryJSEventMock),
  }
};

