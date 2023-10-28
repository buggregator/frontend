import { Meta, Story } from "@storybook/vue3";
import { normalizeSentryEvent } from "~/utils/normalize-event";
import SentryPreview from '~/components/SentryPreview/SentryPreview.vue';
import { sentryMock, sentryJSEventMock, sentryLaravelMock, sentrySpiralMock } from '~/src/entities/sentry/mocks';

export default {
  title: "Sentry/Components/SentryPreview",
  component: SentryPreview
} as Meta<typeof SentryPreview>;

const Template: Story = (args) => ({
  components: { SentryPreview },
  setup() {
    return {
      args,
    };
  },
  template: `<SentryPreview v-bind="args" />`,
});

export const Spiral = Template.bind({});

Spiral.args = {
  event: normalizeSentryEvent(sentrySpiralMock),
};

export const Laravel = Template.bind({});

Laravel.args = {
  event: normalizeSentryEvent(sentryLaravelMock),
};

export const Event = Template.bind({});

Event.args = {
  event: normalizeSentryEvent(sentryMock),
};

export const JSEvent = Template.bind({});

JSEvent.args = {
  event: normalizeSentryEvent(sentryJSEventMock),
};

