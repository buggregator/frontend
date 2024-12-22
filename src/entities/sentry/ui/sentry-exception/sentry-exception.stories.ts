import type { Meta, StoryObj } from "@storybook/vue3";
import { useSentry } from "../../lib";
import { sentryCommonMock } from '../../mocks';
import SentryException from './sentry-exception.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Entities/Sentry/SentryException",
  component: SentryException
} as Meta<typeof SentryException>;


export const Exception: StoryObj<typeof SentryException> = {
  args: {
    exception: normalizeSentryEvent(sentryCommonMock).payload?.exception?.values?.[0],
  }
};
