import type { Meta, StoryObj } from "@storybook/vue3";
import PagePlaceholder from "./page-placeholder.vue";

export default {
  title: "Widgets/PagePlaceholder",
  component: PagePlaceholder
}as Meta<typeof PagePlaceholder>;

const Template: StoryObj = (args: unknown) => ({
  components: { PagePlaceholder },
  setup() {
    return {
      args,
    };
  },
  template: '<PagePlaceholder v-bind="args" />',
});

export const Default = Template.bind({});
Default.args = {
};
