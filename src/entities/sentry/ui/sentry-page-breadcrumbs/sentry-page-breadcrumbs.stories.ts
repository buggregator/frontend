import type { Meta, StoryObj } from "@storybook/vue3";
import { useSentry } from "../../lib";
import { sentryLaravelMock, sentrySpiralMock } from '../../mocks';
import SentryPageBreadcrumbs from './sentry-page-breadcrumbs.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Screens/sentry/SentryPageBreadcrumbs",
  component: SentryPageBreadcrumbs
} as Meta<typeof SentryPageBreadcrumbs>;

export const Laravel: StoryObj<typeof SentryPageBreadcrumbs> = {
  args: {
    breadcrumbs: normalizeSentryEvent(sentryLaravelMock).payload.breadcrumbs?.values,
  }
};

export const Spiral: StoryObj<typeof SentryPageBreadcrumbs> = {
  args: {
    breadcrumbs: normalizeSentryEvent(sentrySpiralMock).payload.breadcrumbs?.values,
  }
};
