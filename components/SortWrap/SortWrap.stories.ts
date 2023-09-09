import { Meta, Story } from "@storybook/vue3";
import SortWrap from "~/components/SortWrap/SortWrap.vue";
import { SORT_ORDER } from "~/config/constants";
import { action } from "@storybook/addon-actions";

export default {
  title: "Components/SortWrap",
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
      SORT_ORDER,
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
          :sort="SORT_ORDER.ASC"
        >
          ASC sort
        </sort-wrap>
      </div>
      <br>
      <div>
        <sort-wrap
          @changeSort="(a) => action('Change Sort')(a)"
          :sort="SORT_ORDER.DESC"
        >
          DESC sort
        </sort-wrap>
      </div>
    </div>`,
});

export const Default = Template.bind({});
Default.args = {
};
