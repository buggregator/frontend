import type { Meta, StoryObj } from "@storybook/vue3";
import { useSentry } from "~/src/entities/sentry";
import { sentryCommonMock, sentrySpiralMock } from '~/src/entities/sentry/mocks';
import SentryPageDevice from './sentry-page-device.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Screens/sentry/SentryPageDevice",
  component: SentryPageDevice
} as Meta<typeof SentryPageDevice>;
export const Device: StoryObj<typeof SentryPageDevice> = {
  args: {
    device: normalizeSentryEvent(sentryCommonMock).payload?.contexts?.device,
  }
};

export const Spiral: StoryObj<typeof SentryPageDevice> = {
  args: {
    device: normalizeSentryEvent(sentrySpiralMock).payload?.contexts?.device,
  }
};
