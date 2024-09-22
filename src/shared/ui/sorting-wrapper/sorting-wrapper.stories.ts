import { action } from "@storybook/addon-actions";
import type { Meta, StoryObj } from "@storybook/vue3";
import type { ComponentProps } from "vue-component-type-helpers";
import { SortingOrder } from "./constants";
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
        SORTING_ORDER: SortingOrder
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
            :sort="SORTING_ORDER.Asc"
          >
            ASC sort
          </sorting-wrapper>
        </div>
        <br>
        <div>
          <sorting-wrapper
            @change-sort="(a) => action('Change Sort')(a)"
            :sort="SORTING_ORDER.Desc"
          >
            DESC sort
          </sorting-wrapper>
        </div>
      </div>`
  })
} as Meta<typeof SortingWrapper>;

export const Default: StoryObj<typeof SortingWrapper> = {
  args: {}
};
