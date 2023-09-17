import { Meta, Story } from "@storybook/vue3";
import { normalizeSentryEvent } from "~/utils/normalize-event";
import sentrySpiralEventMock from '~/mocks/sentry-spiral.json'
import sentryLaravelEventMock from '~/mocks/sentry-laravel.json'
import sentryEventMock from '~/mocks/sentry-event.json'
import sentryJsEventMock from '~/mocks/sentry-js-event.json'
import SentryPreview from '~/components/SentryPreview/SentryPreview.vue';

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
  event: normalizeSentryEvent(sentrySpiralEventMock),
};

export const Laravel = Template.bind({});

Laravel.args = {
  event: normalizeSentryEvent(sentryLaravelEventMock),
};

export const Event = Template.bind({});

Event.args = {
  event: normalizeSentryEvent(sentryEventMock),
};

export const JSEvent = Template.bind({});

JSEvent.args = {
  event: normalizeSentryEvent(sentryJsEventMock),
};

