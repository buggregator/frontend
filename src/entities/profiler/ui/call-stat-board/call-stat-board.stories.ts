import type { Meta, StoryObj } from "@storybook/vue3";
import { profilerEdgesMock } from  "../../mocks";
import CallStatBoard from './call-stat-board.vue';

export default {
  title: "Entities/Profiler/CallStatBoard",
  component: CallStatBoard
} as Meta<typeof CallStatBoard>;

export const Default: StoryObj<typeof CallStatBoard> = {
  args: {
    edge: profilerEdgesMock.e5
  }
};
