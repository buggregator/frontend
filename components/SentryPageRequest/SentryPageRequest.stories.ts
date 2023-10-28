import { Meta, Story } from "@storybook/vue3";
import { normalizeSentryEvent } from "~/utils/normalize-event";
import SentryPageRequest from '~/components/SentryPageRequest/SentryPageRequest.vue';
import { sentryLaravelMock, sentrySpiralMock } from '~/src/entities/sentry/mocks'

export default {
  title: "Sentry/Page/SentryPageRequest",
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
  event: normalizeSentryEvent(sentryLaravelMock).payload,
};

export const Spiral = Template.bind({});

Spiral.args = {
  event: normalizeSentryEvent(sentrySpiralMock).payload,
};
