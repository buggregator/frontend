import type { Meta, Story } from "@storybook/vue3";
import { useSentry } from "../../lib";
import { sentrySpiralMock } from '../../mocks';
import SentryExceptionFrame from './sentry-exception-frame.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Entities/sentry/SentryExceptionFrame",
  component: SentryExceptionFrame
} as Meta<typeof SentryExceptionFrame>;

const Template: Story = (args) => ({
  components: { SentryExceptionFrame },
  setup() {
    return {
      args,
    };
  },
  template: `<SentryExceptionFrame v-bind="args" />`,
});

export const Frame = Template.bind({});

Frame.args = {
  isOpen: true,
  frame: normalizeSentryEvent(sentrySpiralMock).payload?.exception?.values?.[0]?.stacktrace?.frames?.[1],
};
