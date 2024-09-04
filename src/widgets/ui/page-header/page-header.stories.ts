import type { Meta, StoryObj } from "@storybook/vue3";
import {PAGE_TYPES} from "@/shared/constants";
import PageHeader from "./page-header.vue";

const PageHeaderMeta: Meta<typeof PageHeader> = {
  title: "Widgets/PageHeader",
  component: PageHeader,
};

export default PageHeaderMeta;

export const Default: StoryObj<typeof PageHeader> = {
  args: {
    title: "Page title",
    type: PAGE_TYPES.ALL_EVENTS,
  }
};
