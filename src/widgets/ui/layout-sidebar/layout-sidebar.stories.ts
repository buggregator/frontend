import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LayoutSidebar from "./layout-sidebar.vue";

export default {
  title: "Widgets/LayoutSidebar",
  component: LayoutSidebar,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof LayoutSidebar>;

export const Collapsed: StoryObj<typeof LayoutSidebar> = {
  render: () => ({
    components: { LayoutSidebar },
    setup() {
      window.localStorage.setItem("sidebar_collapsed", "true");
      document.documentElement.classList.add("sidebar-collapsed");
    },
    template: '<div style="width: 64px; height: 100vh"><LayoutSidebar /></div>',
  }),
};

export const Expanded: StoryObj<typeof LayoutSidebar> = {
  render: () => ({
    components: { LayoutSidebar },
    setup() {
      window.localStorage.setItem("sidebar_collapsed", "false");
      document.documentElement.classList.remove("sidebar-collapsed");
    },
    template: '<div style="width: 192px; height: 100vh"><LayoutSidebar /></div>',
  }),
};
