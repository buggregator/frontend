import type { Meta, StoryObj } from '@storybook/vue3';
import { httpDumpMock } from '@/entities/http-dump/mocks';
import { inspectorMock } from '@/entities/inspector/mocks';
import { monologMock } from '@/entities/monolog/mocks';
import { profilerMock } from '@/entities/profiler/mocks';
import { sentrySpiralMock } from '@/entities/sentry/mocks';
import { smtpWelcomeMock } from '@/entities/smtp/mocks';
import { varDumpObjectMock } from '@/entities/var-dump/mocks';
import EventPageMapper from './event-page-mapper.vue';

export default {
  title: 'Widgets/EventsPageMapper',
  component: EventPageMapper,
} as Meta<typeof EventPageMapper>;

export const Default: StoryObj<typeof EventPageMapper> = {
  args: {
    event: {
      ...smtpWelcomeMock,
      type: 'unknown',
    },
  },
};

export const Monolog: StoryObj<typeof EventPageMapper> = {
  args: {
    event: monologMock,
  },
};

export const Sentry: StoryObj<typeof EventPageMapper> = {
  args: {
    event: sentrySpiralMock,
  },
};

export const Smtp: StoryObj<typeof EventPageMapper> = {
  args: {
    event: smtpWelcomeMock,
  },
};

export const VarDump: StoryObj<typeof EventPageMapper> = {
  args: {
    event: varDumpObjectMock,
  },
};

export const Profiler: StoryObj<typeof EventPageMapper> = {
  args: {
    event: profilerMock,
  },
};

export const Inspector: StoryObj<typeof EventPageMapper> = {
  args: {
    event: inspectorMock,
  },
};

export const HttpDump: StoryObj<typeof EventPageMapper> = {
  args: {
    event: httpDumpMock,
  },
};
