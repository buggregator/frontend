import type { Meta, StoryObj } from "@storybook/vue3";
import { PAGE_TYPES } from "~/src/shared/constants";
import PageLayout from "./page-layout.vue";

export default {
  title: "Widget/PageLayout",
  component: PageLayout,
} as Meta<typeof PageLayout>;

export const Default: StoryObj<typeof PageLayout> = {
  args: {
    title: "Page Title",
    type: PAGE_TYPES.ALL_EVENTS
  }
};
