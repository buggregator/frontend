import { action } from "@storybook/addon-actions";
import type { Meta, StoryObj } from "@storybook/vue3";
import type { ComponentProps } from "vue-component-type-helpers";
import { SORTING_ORDER } from "./constants";
import SortingWrapper from "./sorting-wrapper.vue";


export default {
  title: "Shared/SortingWrapper",
  component: SortingWrapper,
  render: (args: ComponentProps<typeof SortingWrapper>) => ({
    components: { SortingWrapper },
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
        <sorting-wrapper
          @change-sort="(a) => action('Change Sort')(a)"
        >
          Default sort
        </sorting-wrapper>
      </div>
      <br>
      <div>
        <sorting-wrapper
          @change-sort="(a) => action('Change Sort')(a)"
          :sort="SORTING_ORDER.ASC"
        >
          ASC sort
        </sorting-wrapper>
      </div>
      <br>
      <div>
        <sorting-wrapper
          @change-sort="(a) => action('Change Sort')(a)"
          :sort="SORTING_ORDER.DESC"
        >
          DESC sort
        </sorting-wrapper>
      </div>
    </div>`,
  })
} as Meta<typeof SortingWrapper>;

export const Default: StoryObj<typeof SortingWrapper> = {
  args: {}
};
