import type { Meta, StoryObj } from "@storybook/vue3";
import LayoutSidebar from "./layout-sidebar.vue";

export default {
  title: "Widgets/LayoutSidebar",
  component: LayoutSidebar,
  render: () =>
    ({
      components: { LayoutSidebar },
      template: '<div style="width: 100px; height: 100vh"><LayoutSidebar /></div>',
    }),
} as Meta<typeof LayoutSidebar>;

export const Default: StoryObj<typeof LayoutSidebar> = {
  args: {},
};
