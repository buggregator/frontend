import { Meta, Story } from "@storybook/vue3";
import PagePlaceholder from "./page-placeholder.vue";

export default {
  title: "FSD/widgets/PagePlaceholder",
  component: PagePlaceholder
}as Meta<typeof PagePlaceholder>;

const Template: Story = (args) => ({
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
