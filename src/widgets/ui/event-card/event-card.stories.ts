import type { Meta, StoryObj } from "@storybook/vue3";
import type { ComponentProps } from "vue-component-type-helpers";
import { httpDumpMock } from '~/src/entities/http-dump/mocks';
import { inspectorMock } from '~/src/entities/inspector/mocks';
import { monologMock } from '~/src/entities/monolog/mocks';
import { profilerMock } from  "~/src/entities/profiler/mocks";
import { sentrySpiralMock } from '~/src/entities/sentry/mocks';
import { smtpWelcomeMock } from '~/src/entities/smtp/mocks';
import { varDumpObjectMock } from "~/src/entities/var-dump/mocks";
import type { EVENT_TYPES } from "~/src/shared/types";
import EventCard from "./event-card.vue";

export default {
  title: "Widgets/EventCard",
  component: EventCard
} as Meta<typeof EventCard>;

export const Default: StoryObj<typeof EventCard> = {
  args: {
    event: { ...smtpWelcomeMock, type: "unknown" },
  }
};

export const Monolog: StoryObj<typeof EventCard> = {
  args: {
    event: monologMock,
  }
};

export const Sentry: StoryObj<typeof EventCard> = {
  args: {
    event: sentrySpiralMock,
  }
};

export const Smtp: StoryObj<typeof EventCard> = {
  args: {
    event: smtpWelcomeMock,
  }
};

export const VarDump: StoryObj<typeof EventCard> = {
  args: {
    event: varDumpObjectMock,
  }
};

export const Profiler: StoryObj<typeof EventCard> = {
  args: {
    event: profilerMock,
  }
};

export const Inspector: StoryObj<typeof EventCard> = {
  args: {
    event: inspectorMock,
  }
};

export const HttpDump: StoryObj<typeof EventCard> = {
  args: {
    event: httpDumpMock,
  }
};

const eventsList = [
  monologMock,
  sentrySpiralMock,
  smtpWelcomeMock,
  varDumpObjectMock,
  profilerMock,
  inspectorMock,
  httpDumpMock,
];

export const EventsList = {
  args: {
    event: inspectorMock,
  },
  render: (args: ComponentProps<typeof EventCard<EVENT_TYPES>>) => ({
    components: { EventCard },
    setup() {
      return {
        args,
        eventsList,
      };
    },
    template: `<EventCard class="border-b" v-for="event in eventsList" :event="event" :key="event.uuid"/>`,
  }),
};

export const EventsListVirtual: StoryObj<typeof EventCard> = {
  args: {
    event: inspectorMock,
  },
  render: (args:ComponentProps<typeof EventCard>) => ({
    components: { EventCard },
    setup() {
      return {
        args,
        eventsList: eventsList
          .concat(eventsList)
          .concat(eventsList)
          .concat(eventsList)
          .concat(eventsList)
          .concat(eventsList)
          .map((item, index) => ({ ...item, uuid: String(index + 1) })) // make uniq ids
          .sort(() => Math.random() - 0.5), // shuffle
      };
    },
    template: `
    <template v-for="item in eventsList">
      <EventCard class="border-b" :event="item" />
    </template>
  `,
  }),
};
