import type { Meta, StoryObj } from "@storybook/vue3-vite";
import type { ServerEvent } from "@/shared/types";
import { useSentry } from "../../lib";
import { sentryMock, sentryJSEventMock, sentryLaravelMock, sentryPythonMock, sentryPythonLogMock, sentrySpiralMock } from '../../mocks';
import type {Sentry} from "../../types";
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

export const Python: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeSentryEvent(sentryPythonMock as unknown as ServerEvent<Sentry>), // TODO: fix ServerEvent<Sentry>
  }
};

export const PythonLog: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeSentryEvent(sentryPythonLogMock as unknown as ServerEvent<Sentry>), // TODO: fix ServerEvent<Sentry>
  }
};

export const WithOccurrenceBadge: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeSentryEvent(sentryLaravelMock),
    occurrenceCount: 184,
  }
};

