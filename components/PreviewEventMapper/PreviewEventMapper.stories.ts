import { Meta, Story } from "@storybook/vue3";
import PreviewEventMapper from "~/components/PreviewEventMapper/PreviewEventMapper.vue";
import sentryEventMock from "~/mocks/sentry-spiral.json";
import smtpEventMock from "~/mocks/smtp-welcome.json";
import varDumpEventMock from "~/mocks/var-dump-object.json";
import inspectorEventMock from "~/mocks/inspector.json";
import httpDumpEventMock from "~/mocks/http-dump.json";
import { profilerMock } from  "~/src/entities/profiler/mocks";
import { monologMock } from '~/src/entities/monolog/mocks'

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
  event: { ...smtpEventMock, type: "unknown" },
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
  event: smtpEventMock,
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
  event: inspectorEventMock,
};

export const HttpDump = Template.bind({});
HttpDump.args = {
  event: httpDumpEventMock,
};

const eventsList = [
  monologMock,
  sentryEventMock,
  smtpEventMock,
  varDumpEventMock,
  profilerMock,
  inspectorEventMock,
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
  event: inspectorEventMock,
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
  event: inspectorEventMock,
};
