import { Meta, Story } from "@storybook/vue3";
import { normalizeSentryEvent } from "~/utils/normalize-event";
import SentryPageApp from '~/components/SentryPageApp/SentryPageApp.vue';
import { sentryCommonMock } from '~/src/entities/sentry/mocks';

export default {
  title: "Sentry/Page/SentryPageApp",
  component: SentryPageApp
} as Meta<typeof SentryPageApp>;

const Template: Story = (args) => ({
  components: { SentryPageApp },
  setup() {
    return {
      args,
    };
  },
  template: `<SentryPageApp v-bind="args" />`,
});

export const App = Template.bind({});

App.args = {
  event: normalizeSentryEvent(sentryCommonMock).payload,
};
