import { Meta, Story } from "@storybook/vue3";
import SentryPageApp from '~/components/SentryPageApp/SentryPageApp.vue';
import { sentryCommonMock } from '~/src/entities/sentry/mocks';
import { useSentry } from "~/src/entities/sentry";

const { normalizeSentryEvent } = useSentry();

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
