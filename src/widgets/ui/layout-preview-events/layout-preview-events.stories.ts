import type { Meta, StoryObj } from "@storybook/vue3";
import { ALL_EVENT_TYPES } from "@/shared/constants";
import LayoutPreviewEvents from "./layout-preview-events.vue";

export default {
  title: "Widgets/LayoutPreviewEvents",
  component: LayoutPreviewEvents,
} as Meta<typeof LayoutPreviewEvents>;

export const Default: StoryObj<typeof LayoutPreviewEvents> = {
  args: {
    title: "Page Title",
    type: ALL_EVENT_TYPES
  }
};
