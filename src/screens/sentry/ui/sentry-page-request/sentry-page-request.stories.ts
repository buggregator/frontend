import { Meta, Story } from "@storybook/vue3";
import { useSentry } from "~/src/entities/sentry";
import { sentryLaravelMock, sentrySpiralMock } from '~/src/entities/sentry/mocks';
import SentryPageRequest from './sentry-page-request.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Screens/sentry/SentryPageRequest",
  component: SentryPageRequest
} as Meta<typeof SentryPageRequest>;

const Template: Story = (args) => ({
  components: { SentryPageRequest },
  setup() {
    return {
      args,
    };
  },
  template: `<SentryPageRequest v-bind="args" />`,
});

export const Laravel = Template.bind({});

Laravel.args = {
  payload: normalizeSentryEvent(sentryLaravelMock).payload,
};

export const Spiral = Template.bind({});

Spiral.args = {
  payload: normalizeSentryEvent(sentrySpiralMock).payload,
};
