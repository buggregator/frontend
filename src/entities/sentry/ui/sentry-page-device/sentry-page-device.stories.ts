import type { Meta, StoryObj } from "@storybook/vue3";
import { useSentry } from "../../lib";
import { sentryCommonMock, sentrySpiralMock } from '../../mocks';
import SentryPageDevice from './sentry-page-device.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Entities/Sentry/SentryPageDevice",
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
