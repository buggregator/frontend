import type { Meta, StoryObj } from '@storybook/vue3';
import { useSentry } from '../../lib';
import { sentrySpiralMock } from '../../mocks';
import SentryExceptionFrame from './sentry-exception-frame.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: 'Entities/sentry/SentryExceptionFrame',
  component: SentryExceptionFrame,
} as Meta<typeof SentryExceptionFrame>;

export const Frame: StoryObj<typeof SentryExceptionFrame> = {
  args: {
    isOpen: true,
    frame:
      normalizeSentryEvent(sentrySpiralMock).payload?.exception?.values?.[0]?.stacktrace
        ?.frames?.[1],
  },
};
