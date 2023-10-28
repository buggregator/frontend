import { Meta, Story } from "@storybook/vue3";
import PreviewEventMapper from "~/components/PreviewEventMapper/PreviewEventMapper.vue";
import sentryEventMock from "~/mocks/sentry-spiral.json";
import varDumpEventMock from "~/mocks/var-dump-object.json";
import httpDumpEventMock from "~/mocks/http-dump.json";
import { profilerMock } from  "~/src/entities/profiler/mocks";
import { monologMock } from '~/src/entities/monolog/mocks';
import { inspectorMock } from '~/src/entities/inspector/mocks';
import { smtpWelcomeMock } from '~/src/entities/smtp/mocks';

export default {
  title: "Preview/PreviewEventMapper",
  component: PreviewEventMapper,
} as Meta<typeof PreviewEventMapper>;

const Template: Story = (args) => ({
  components: { PreviewEventMapper },
  setup() {
    return {
      args,
    };
  },
  template: `<PreviewEventMapper v-bind="args" />`,
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
  event: sentryEventMock,
};

export const Smtp = Template.bind({});

Smtp.args = {
  event: smtpWelcomeMock,
};

export const VarDump = Template.bind({});

VarDump.args = {
  event: varDumpEventMock,
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
  event: httpDumpEventMock,
};

const eventsList = [
  monologMock,
  sentryEventMock,
  smtpWelcomeMock,
  varDumpEventMock,
  profilerMock,
  inspectorMock,
  httpDumpEventMock,
];

const TemplateList: Story = (args) => ({
  components: { PreviewEventMapper },
  setup() {
    return {
      args,
      eventsList,
    };
  },
  template: `<PreviewEventMapper class="border-b" v-for="event in eventsList" :event="event" :key="event.uuid"/>`,
});

export const EventsList = TemplateList.bind({});

EventsList.args = {
  event: inspectorMock,
};

const TemplateListVirtual: Story = (args) => ({
  components: { PreviewEventMapper },
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
      <PreviewEventMapper class="border-b" :event="item" />
    </template>
  `,
});

export const EventsListVirtual = TemplateListVirtual.bind({});

EventsListVirtual.args = {
  event: inspectorMock,
};
