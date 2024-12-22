import type { Meta, StoryObj } from "@storybook/vue3";
import { useSentry } from "../../lib";
import { sentryMock, sentryJSEventMock, sentryLaravelMock, sentrySpiralMock } from '../../mocks';
import PreviewCard from './preview-card.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Entities/Sentry/PreviewCard",
  component: PreviewCard
} as Meta<typeof PreviewCard>;
export const Spiral: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeSentryEvent(sentrySpiralMock),
  }
};

export const Laravel: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeSentryEvent(sentryLaravelMock),
  }
};

export const Event: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeSentryEvent(sentryMock),
  }
};

export const JSEvent: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeSentryEvent(sentryJSEventMock),
  }
};

