import type { Meta, StoryObj } from "@storybook/vue3-vite";
import type { ServerEvent } from "@/shared/types";
import { useSentry } from "../../lib";
import {
  sentryCommonMock,
  sentryMock,
  sentryJSMock,
  sentryJSEventMock,
  sentryLaravelMock,
  sentryPythonMock,
  sentryPythonLogMock,
  sentrySpiralMock,
} from '../../mocks';
import type {Sentry} from "../../types";
import SentryPage from './sentry-page.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Entities/Sentry/SentryPage",
  component: SentryPage,
  parameters: {
    layout: 'fullscreen',
  }
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

export const PageLaravel: StoryObj<typeof SentryPage> = {
  args: {
    event: normalizeSentryEvent(sentryLaravelMock),
  }
};

export const PageSpiral: StoryObj<typeof SentryPage> = {
  args: {
    event: normalizeSentryEvent(sentrySpiralMock),
  }
};

export const PageJS: StoryObj<typeof SentryPage> = {
  args: {
    event: normalizeSentryEvent(sentryJSMock),
  }
};

export const PageJSMessage: StoryObj<typeof SentryPage> = {
  args: {
    event: normalizeSentryEvent(sentryJSEventMock),
  }
};

export const PagePython: StoryObj<typeof SentryPage> = {
  args: {
    event: normalizeSentryEvent(sentryPythonMock as unknown as ServerEvent<Sentry>), // TODO: fix ServerEvent<Sentry>
  }
};

export const PagePythonLog: StoryObj<typeof SentryPage> = {
  args: {
    event: normalizeSentryEvent(sentryPythonLogMock as unknown as ServerEvent<Sentry>), // TODO: fix ServerEvent<Sentry>
  }
};
