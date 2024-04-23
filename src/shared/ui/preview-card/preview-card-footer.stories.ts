import type { Meta, StoryObj } from "@storybook/vue3";
import PreviewCardFooter from "./preview-card-footer.vue";

export default {
  title: "Shared/PreviewCardFooter",
  component: PreviewCardFooter,
}as Meta<typeof PreviewCardFooter>;

export const Default: StoryObj<typeof PreviewCardFooter> = {
  args: {
    serverName: "My server",
    originConfig: {
      one: '1',
      two: '2',
    },
  }
}
