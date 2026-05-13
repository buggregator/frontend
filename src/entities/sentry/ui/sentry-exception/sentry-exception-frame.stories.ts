import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useSentry } from "../../lib";
import { sentrySpiralMock } from '../../mocks';
import SentryExceptionFrame from './sentry-exception-frame.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Entities/Sentry/SentryExceptionFrame",
  component: SentryExceptionFrame
} as Meta<typeof SentryExceptionFrame>;


export const Frame: StoryObj<typeof SentryExceptionFrame> = {
  args: {
    isOpen: true,
    frame: normalizeSentryEvent(sentrySpiralMock).payload?.exception?.values?.[0]?.stacktrace?.frames?.[1],
  }
};

// A frame that has variables but no source context (no context_line /
// pre_context / post_context). Before the fix, expanding such a frame
// produced an empty body — the vars are now rendered as a fallback list.
export const VarsOnlyNoSource: StoryObj<typeof SentryExceptionFrame> = {
  args: {
    isOpen: true,
    frame: {
      filename: 'vendor/lib/internal.php',
      function: 'callUserFunction',
      lineno: 42,
      in_app: false,
      vars: {
        userId: 17,
        attempts: 3,
        config: { retries: 5, timeout: 1000 },
        token: null,
      },
    } as never,
  },
};

// A frame with no body and no vars must still render a single line with no
// expandable body (chevron hidden).
export const Bare: StoryObj<typeof SentryExceptionFrame> = {
  args: {
    isOpen: false,
    frame: {
      filename: '[internal]',
      function: 'spl_autoload_call',
      lineno: 0,
      in_app: false,
    } as never,
  },
};
