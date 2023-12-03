import type { Meta, Story } from "@storybook/vue3";
import { useSentry } from "~/src/entities/sentry";
import { sentryLaravelMock, sentrySpiralMock } from '~/src/entities/sentry/mocks';
import SentryPageTags from './sentry-page-tags.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Screens/sentry/SentryPageTags",
  component: SentryPageTags
} as Meta<typeof SentryPageTags>;

const Template: Story = (args) => ({
  components: { SentryPageTags },
  setup() {
    return {
      args,
    };
  },
  template: `<SentryPageTags v-bind="args" />`,
});

export const Laravel = Template.bind({});

Laravel.args = {
  payload: normalizeSentryEvent(sentryLaravelMock).payload,
};

export const Spiral = Template.bind({});

Spiral.args = {
  payload: normalizeSentryEvent(sentrySpiralMock).payload,
};
