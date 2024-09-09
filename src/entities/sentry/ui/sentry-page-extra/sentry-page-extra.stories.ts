import type { Meta, StoryObj } from "@storybook/vue3";
import { useSentry } from "../../lib";
import { sentryLaravelMock, sentrySpiralMock } from '../../mocks';
import SentryPageExtra from './sentry-page-extra.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Screens/sentry/SentryPageExtra",
  component: SentryPageExtra
} as Meta<typeof SentryPageExtra>;

export const Laravel: StoryObj<typeof SentryPageExtra> = {
  args: {
    extra: normalizeSentryEvent(sentryLaravelMock).payload.extra,
  }
};

export const Spiral: StoryObj<typeof SentryPageExtra> = {
  args: {
    extra: normalizeSentryEvent(sentrySpiralMock).payload.extra,
  }
};
