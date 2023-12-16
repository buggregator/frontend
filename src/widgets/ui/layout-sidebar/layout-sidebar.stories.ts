import type { Meta, StoryObj } from "@storybook/vue3";
import LayoutSidebar from "./layout-sidebar.vue";

export default {
  title: "Widgets/LayoutSidebar",
  component: LayoutSidebar
}as Meta<typeof LayoutSidebar>;

const Template: StoryObj = (args: unknown) => ({
  components: { LayoutSidebar },
  setup() {
    return {
      args,
    };
  },
  template: '<div style="width: 100px;"><LayoutSidebar v-bind="args" /></div>',
});

export const Default = Template.bind({});
Default.args = {
  apiVersion: "v1.0.0",
  clientVersion: "v1.0.0",
};
