import type { Meta, StoryObj } from "@storybook/vue3";
import PreviewCardFooter from "./preview-card-footer.vue";

export default {
  title: "Shared/PreviewCardFooter",
  component: PreviewCardFooter,
}as Meta<typeof PreviewCardFooter>;

const Template: StoryObj = (args: unknown) => ({
  components: { PreviewCardFooter },
  setup() {
    return {
      args,
    };
  },
  template: '<PreviewCardFooter v-bind="args" />',
});

export const Default = Template.bind({});
Default.args = {
  serverName: "My server",
  originConfig: {
    one: 1,
    two: 2,
  },
};
