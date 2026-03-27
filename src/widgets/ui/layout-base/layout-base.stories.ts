import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LayoutBase from "./layout-base.vue";

export default {
  title: "Widgets/LayoutBase",
  component: LayoutBase,
} as Meta<typeof LayoutBase>;

export const Default: StoryObj<typeof LayoutBase> = {
  args: {
  }
};
