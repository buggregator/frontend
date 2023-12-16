import type { Meta, StoryObj } from "@storybook/vue3";
import PagePlaceholder from "./page-placeholder.vue";

export default {
  title: "Widgets/PagePlaceholder",
  component: PagePlaceholder
}as Meta<typeof PagePlaceholder>;

export const Default: StoryObj<typeof PagePlaceholder> = {
  args: {}
};
