import type { Meta, StoryObj } from "@storybook/vue3";
import { httpDumpMock } from '~/src/entities/http-dump/mocks';
import { inspectorMock } from '~/src/entities/inspector/mocks';
import { monologMock } from '~/src/entities/monolog/mocks';
import { profilerMock } from  "~/src/entities/profiler/mocks";
import { sentrySpiralMock } from '~/src/entities/sentry/mocks';
import { smtpWelcomeMock } from '~/src/entities/smtp/mocks';
import { varDumpObjectMock } from "~/src/entities/var-dump/mocks";
import PreviewCard from "./event-card.vue";

export default {
  title: "Widgets/PreviewCard",
  component: PreviewCard,
} as Meta<typeof PreviewCard>;

const Template: StoryObj = (args: unknown) => ({
  components: { PreviewCard },
  setup() {
    return {
      args,
    };
  },
  template: `<PreviewCard v-bind="args" />`,
});

export const Default = Template.bind({});

Default.args = {
  event: { ...smtpWelcomeMock, type: "unknown" },
};

export const Monolog = Template.bind({});

Monolog.args = {
  event: monologMock,
};

export const Sentry = Template.bind({});

Sentry.args = {
  event: sentrySpiralMock,
};

export const Smtp = Template.bind({});

Smtp.args = {
  event: smtpWelcomeMock,
};

export const VarDump = Template.bind({});

VarDump.args = {
  event: varDumpObjectMock,
};

export const Profiler = Template.bind({});

Profiler.args = {
  event: profilerMock,
};

export const Inspector = Template.bind({});

Inspector.args = {
  event: inspectorMock,
};

export const HttpDump = Template.bind({});
HttpDump.args = {
  event: httpDumpMock,
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

const TemplateList: StoryObj = (args: unknown) => ({
  components: { PreviewCard },
  setup() {
    return {
      args,
      eventsList,
    };
  },
  template: `<PreviewCard class="border-b" v-for="event in eventsList" :event="event" :key="event.uuid"/>`,
});

export const EventsList = TemplateList.bind({});

EventsList.args = {
  event: inspectorMock,
};

const TemplateListVirtual: StoryObj = (args: unknown) => ({
  components: { PreviewCard },
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
      <PreviewCard class="border-b" :event="item" />
    </template>
  `,
});

export const EventsListVirtual = TemplateListVirtual.bind({});

EventsListVirtual.args = {
  event: inspectorMock,
};
