import { Meta, Story } from "@storybook/vue3";
import { PreviewCard } from '~/src/shared/ui';
import { useSentry } from "../../lib";
import { sentryMock, sentryJSEventMock, sentryLaravelMock, sentrySpiralMock } from '../../mocks';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Entities/sentry/PreviewCard",
  component: PreviewCard
} as Meta<typeof PreviewCard>;

const Template: Story = (args) => ({
  components: { PreviewCard },
  setup() {
    return {
      args,
    };
  },
  template: `<PreviewCard v-bind="args" />`,
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

