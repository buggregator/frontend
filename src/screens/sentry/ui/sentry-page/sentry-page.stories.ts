import { Meta, Story } from "@storybook/vue3";
import { useSentry } from "~/src/entities/sentry";
import { sentryCommonMock, sentryMock, sentryJSMock, sentryJSEventMock } from '~/src/entities/sentry/mocks';
import SentryPage from './sentry-page.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Screens/sentry/SentryPage",
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
  event: normalizeSentryEvent(sentryMock),
};

export const PageJS = Template.bind({});

PageJS.args = {
  event: normalizeSentryEvent(sentryJSMock),
};

export const PageJSEvent = Template.bind({});

PageJSEvent.args = {
  event: normalizeSentryEvent(sentryJSEventMock),
};

