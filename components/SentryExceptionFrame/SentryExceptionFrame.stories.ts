import { Meta, Story } from "@storybook/vue3";
import { normalizeSentryEvent } from "~/utils/normalize-event";
import { Sentry } from "~/config/types";
import SentryExceptionFrame from '~/components/SentryExceptionFrame/SentryExceptionFrame.vue';
import { sentrySpiralMock } from '~/src/entities/sentry/mocks';

export default {
  title: "Sentry/Components/SentryExceptionFrame",
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
  frame: (normalizeSentryEvent(sentrySpiralMock)?.payload as Sentry)?.exception?.values[0]?.stacktrace?.frames[1],
};
