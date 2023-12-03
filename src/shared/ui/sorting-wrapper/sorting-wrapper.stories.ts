import { action } from "@storybook/addon-actions";
import type { Meta, Story } from "@storybook/vue3";
import { SORTING_ORDER } from "./constants";
import SortWrap from "./sorting-wrapper.vue";

export default {
  title: "Shared/SortingWrapper",
  component: SortWrap,
} as Meta<typeof SortWrap>;

const Template: Story = (args) => ({
  components: { SortWrap },
  methods: {
    action
  },
  setup() {
    return {
      args,
      SORTING_ORDER,
    };
  },

  template: `
    <div>
      <div>
        <sort-wrap
          @changeSort="(a) => action('Change Sort')(a)"
        >
          Default sort
        </sort-wrap>
      </div>
      <br>
      <div>
        <sort-wrap
          @changeSort="(a) => action('Change Sort')(a)"
          :sort="SORTING_ORDER.ASC"
        >
          ASC sort
        </sort-wrap>
      </div>
      <br>
      <div>
        <sort-wrap
          @changeSort="(a) => action('Change Sort')(a)"
          :sort="SORTING_ORDER.DESC"
        >
          DESC sort
        </sort-wrap>
      </div>
    </div>`,
});

export const Default = Template.bind({});
Default.args = {
};
