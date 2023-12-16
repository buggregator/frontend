import type { Meta, StoryObj } from "@storybook/vue3";
import { useSentry } from "../../lib";
import { sentryCommonMock } from '../../mocks';
import SentryException from './sentry-exception.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Entities/sentry/SentryException",
  component: SentryException
} as Meta<typeof SentryException>;

const Template: StoryObj = (args: unknown) => ({
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
  exception: normalizeSentryEvent(sentryCommonMock).payload?.exception?.values?.[0],
};
