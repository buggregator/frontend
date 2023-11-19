import { Meta, Story } from "@storybook/vue3";
import { useSentry } from "~/src/entities/sentry";
import { sentryLaravelMock, sentrySpiralMock } from '~/src/entities/sentry/mocks'
import SentryPageBreadcrumbs from './sentry-page-breadcrumbs.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Screens/sentry/SentryPageBreadcrumbs",
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
  breadcrumbs: normalizeSentryEvent(sentryLaravelMock).payload.breadcrumbs?.values,
};

export const Spiral = Template.bind({});

Spiral.args = {
  breadcrumbs: normalizeSentryEvent(sentrySpiralMock).payload.breadcrumbs?.values,
};
