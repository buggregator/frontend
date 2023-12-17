import type { Meta, StoryObj } from "@storybook/vue3";
import { useSentry } from "~/src/entities/sentry";
import { sentryLaravelMock, sentrySpiralMock } from '~/src/entities/sentry/mocks';
import SentryPageRequest from './sentry-page-request.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Screens/sentry/SentryPageRequest",
  component: SentryPageRequest
} as Meta<typeof SentryPageRequest>;

export const Laravel: StoryObj<typeof SentryPageRequest> = {
  args: {
    request: normalizeSentryEvent(sentryLaravelMock).payload.request,
  }
};

export const Spiral: StoryObj<typeof SentryPageRequest> = {
  args: {
    request: normalizeSentryEvent(sentrySpiralMock).payload.request,
  }
};
