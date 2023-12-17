import type { Meta, StoryObj } from "@storybook/vue3";
import type { ComponentProps } from "vue-component-type-helpers";
import LayoutSidebar from "./layout-sidebar.vue";

export default {
  title: "Widgets/LayoutSidebar",
  component: LayoutSidebar,
  render: (args: ComponentProps<typeof LayoutSidebar>) => ({
    components: { LayoutSidebar },
    setup() {
      return {
        args,
      };
    },
    template: '<div style="width: 100px;"><LayoutSidebar v-bind="args" /></div>',
  })
}as Meta<typeof LayoutSidebar>;

export const Default: StoryObj<typeof LayoutSidebar> = {
  args: {
    apiVersion: "v1.0.0",
    clientVersion: "v1.0.0",
  }
};
