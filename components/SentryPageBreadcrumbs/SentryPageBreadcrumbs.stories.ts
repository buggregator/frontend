import { Meta, Story } from "@storybook/vue3";
import { normalizeSentryEvent } from "~/utils/normalize-event";
import SentryPageBreadcrumbs from '~/components/SentryPageBreadcrumbs/SentryPageBreadcrumbs.vue';
import { sentryLaravelMock, sentrySpiralMock } from '~/src/entities/sentry/mocks'

export default {
  title: "Sentry/Page/SentryPageBreadcrumbs",
  component: SentryPageBreadcrumbs
} as Meta<typeof SentryPageBreadcrumbs>;

const Template: Story = (args) => ({
  components: { SentryPageBreadcrumbs },
  setup() {
    return {
      args,
    };
  },
  template: `<SentryPageBreadcrumbs v-bind="args" />`,
});

export const Laravel = Template.bind({});

Laravel.args = {
  event: normalizeSentryEvent(sentryLaravelMock).payload,
};

export const Spiral = Template.bind({});

Spiral.args = {
  event: normalizeSentryEvent(sentrySpiralMock).payload,
};
