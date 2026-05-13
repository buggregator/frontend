import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useSentry } from "../../lib";
import { sentryLaravelMock, sentrySpiralMock } from '../../mocks';
import SentryPageTags from './sentry-page-tags.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Entities/Sentry/SentryPageTags",
  component: SentryPageTags
} as Meta<typeof SentryPageTags>;

export const Laravel: StoryObj<typeof SentryPageTags> = {
  args: {
    payload: normalizeSentryEvent(sentryLaravelMock).payload,
  }
};

export const Spiral: StoryObj<typeof SentryPageTags> = {
  args: {
    payload: normalizeSentryEvent(sentrySpiralMock).payload,
  }
};

// A payload that omits runtime / os / sdk and logger / server_name. The
// section should hide its empty context boxes and empty tag pills entirely
// rather than render placeholder rows with blank values.
export const MinimalNoContexts: StoryObj<typeof SentryPageTags> = {
  args: {
    payload: {
      event_id: 'mini-1',
      environment: 'production',
      platform: 'php',
      // No logger, server_name, contexts, sdk — everything else stripped.
    } as never,
  },
};

// A payload with only logger + env populated. Verifies that those tags appear
// without the runtime/os/server pills.
export const EnvAndLoggerOnly: StoryObj<typeof SentryPageTags> = {
  args: {
    payload: {
      event_id: 'env-only-1',
      environment: 'staging',
      logger: 'app.errors',
      platform: 'php',
    } as never,
  },
};
