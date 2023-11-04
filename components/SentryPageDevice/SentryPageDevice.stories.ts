import { Meta, Story } from "@storybook/vue3";
import SentryPageDevice from '~/components/SentryPageDevice/SentryPageDevice.vue';
import { sentryCommonMock } from '~/src/entities/sentry/mocks';
import { useSentry } from "~/src/entities/sentry";

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Sentry/Page/SentryPageDevice",
  component: SentryPageDevice
} as Meta<typeof SentryPageDevice>;

const Template: Story = (args) => ({
  components: { SentryPageDevice },
  setup() {
    return {
      args,
    };
  },
  template: `<SentryPageDevice v-bind="args" />`,
});

export const Device = Template.bind({});

Device.args = {
  event: normalizeSentryEvent(sentryCommonMock).payload,
};
