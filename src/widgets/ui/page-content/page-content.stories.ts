import type { Meta, StoryObj } from "@storybook/vue3";
import { PAGE_TYPES } from "@/shared/constants";
import PageContent from "./page-content.vue";

export default {
  title: "Widgets/PageContent",
  component: PageContent,
} as Meta<typeof PageContent>;

export const Default: StoryObj<typeof PageContent> = {
  args: {
    title: "Page Title",
    type: PAGE_TYPES.ALL_EVENTS
  }
};
