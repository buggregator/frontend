import { Meta, Story } from "@storybook/vue3";
import { useSentry } from "~/src/entities/sentry";
import { sentryCommonMock, sentrySpiralMock } from '~/src/entities/sentry/mocks';
import SentryPageDevice from './sentry-page-device.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Screens/sentry/SentryPageDevice",
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
  device: normalizeSentryEvent(sentryCommonMock).payload?.contexts?.device,
};

export const Spiral = Template.bind({});

Spiral.args = {
  device: normalizeSentryEvent(sentrySpiralMock).payload?.contexts?.device,
};
