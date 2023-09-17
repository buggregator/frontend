import { Meta, Story } from "@storybook/vue3";
import { normalizeSentryEvent } from "~/utils/normalize-event";
import sentryCommonMock from '~/mocks/sentry-common.json'
import sentryEventMock from '~/mocks/sentry-event.json'
import SentryPage from '~/components/SentryPage/SentryPage.vue';

export default {
  title: "Sentry/Page/SentryPage",
  component: SentryPage
} as Meta<typeof SentryPage>;

const Template: Story = (args) => ({
  components: { SentryPage },
  setup() {
    return {
      args,
    };
  },
  template: `<SentryPage v-bind="args" />`,
});

export const PageCommon = Template.bind({});

PageCommon.args = {
  event: normalizeSentryEvent(sentryCommonMock),
};

export const PageEvent = Template.bind({});

PageEvent.args = {
  event: normalizeSentryEvent(sentryEventMock),
};
