import type { Meta, StoryObj } from "@storybook/vue3";
import { EventTypes } from "../../types";
import PreviewCard from "./preview-card.vue";

export default {
  title: "Shared/PreviewCard",
  component: PreviewCard
} as Meta<typeof PreviewCard>;

export const Default: StoryObj<typeof PreviewCard> = {
  args: {
    event: {
      id: "da076402-6f98-4ada-bae2-d77d405cf427",
      type: EventTypes.Monolog,
      serverName: "My server",
      origin: {
        one: 1,
        two: 2
      },
      payload: [],
      date: new Date(1673266869 * 1000),
      labels: ["Monolog", "200"]
    }
  }
};
