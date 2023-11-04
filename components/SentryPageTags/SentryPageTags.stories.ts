import { Meta, Story } from "@storybook/vue3";
import SentryPageTags from '~/components/SentryPageTags/SentryPageTags.vue';
import { sentryLaravelMock, sentrySpiralMock } from '~/src/entities/sentry/mocks';
import { useSentry } from "~/src/entities/sentry";

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Sentry/Page/SentryPageTags",
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
  event: normalizeSentryEvent(sentryLaravelMock).payload,
};

export const Spiral = Template.bind({});

Spiral.args = {
  event: normalizeSentryEvent(sentrySpiralMock).payload,
};
