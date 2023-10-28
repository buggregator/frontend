import { Meta, Story } from "@storybook/vue3";
import { normalizeSentryEvent } from "~/utils/normalize-event";
import { Sentry } from "~/config/types";
import SentryException from '~/components/SentryException/SentryException.vue';
import { sentryCommonMock } from '~/src/entities/sentry/mocks';

export default {
  title: "Sentry/Components/SentryException",
  component: SentryException
} as Meta<typeof SentryException>;

const Template: Story = (args) => ({
  components: { SentryException },
  setup() {
    return {
      args,
    };
  },
  template: `<SentryException v-bind="args" />`,
});

export const Exception = Template.bind({});

Exception.args = {
  exception: (normalizeSentryEvent(sentryCommonMock)?.payload as Sentry)?.exception?.values[0],
};
