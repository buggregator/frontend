import type { Meta, StoryObj } from "@storybook/vue3";
import { profilerEdgesMock } from  "@/entities/profiler/mocks";
import CallStatBoard from './call-stat-board.vue';

export default {
  title: "Screens/profiler/CallStatBoard",
  component: CallStatBoard
} as Meta<typeof CallStatBoard>;

export const Default: StoryObj<typeof CallStatBoard> = {
  args: {
    edge: profilerEdgesMock.e5
  }
};
